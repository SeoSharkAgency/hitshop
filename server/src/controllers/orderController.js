const { Op } = require('sequelize');
const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { resolveBasePrice } = require('../pricing');
const { notifyNewOrder, notifyStatusChange } = require('../telegram');
const { logAction } = require('../auditLog');
const { sendOrderConfirmation } = require('../mailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hitshop-secret-key';

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customerName, customerPhone, customerEmail, deliveryAddress, deliveryCityRef, deliveryWarehouseRef, deliveryCost, notes, items } = req.body;

    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type === 'user') userId = decoded.id;
      } catch {}
    }

    if (!customerName || !customerPhone) {
      await t.rollback();
      return res.status(400).json({ error: "Вкажіть ім'я та телефон" });
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail))) {
      await t.rollback();
      return res.status(400).json({ error: 'Вкажіть коректний email' });
    }

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Кошик порожній' });
    }

    if (items.length > 50) {
      await t.rollback();
      return res.status(400).json({ error: 'Забагато позицій' });
    }

    let total = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1 || item.quantity > 100) {
        await t.rollback();
        return res.status(400).json({ error: 'Невірна кількість товару' });
      }
      const product = await Product.findByPk(item.productId, { lock: true, transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ error: `Товар з id ${item.productId} не знайдено` });
      }

      const sizes = product.sizes || {};
      const hasSizes = Object.keys(sizes).length > 0;

      if (hasSizes) {
        if (!item.size) {
          await t.rollback();
          return res.status(400).json({ error: `"${product.name}" — оберіть розмір` });
        }
        if (sizes[item.size] === undefined) {
          await t.rollback();
          return res.status(400).json({ error: `"${product.name}" — розмір "${item.size}" не існує` });
        }
        if (sizes[item.size] < item.quantity) {
          await t.rollback();
          return res.status(400).json({ error: `"${product.name}" (${item.size}) — залишилось лише ${sizes[item.size]} шт.` });
        }
      } else {
        if (product.stock < item.quantity) {
          await t.rollback();
          return res.status(400).json({ error: `"${product.name}" — залишилось лише ${product.stock} шт.` });
        }
      }

      // Набивка опційна: клієнт обирає кожен тип окремо
      const hasPrintNumber = !!(item.printNumber && String(item.printNumber).trim());
      const hasPrintName = !!(item.printName && String(item.printName).trim());
      if (!product.printNumberEnabled && hasPrintNumber) {
        await t.rollback();
        return res.status(400).json({ error: `"${product.name}" — набивка номера недоступна` });
      }
      if (!product.printNameEnabled && hasPrintName) {
        await t.rollback();
        return res.status(400).json({ error: `"${product.name}" — набивка тексту недоступна` });
      }

      let unitPrice = resolveBasePrice(product, !!userId);
      if (hasPrintNumber) unitPrice += parseFloat(product.printNumberPrice) || 0;
      if (hasPrintName) unitPrice += parseFloat(product.printNamePrice) || 0;
      item._unitPrice = unitPrice;

      total += unitPrice * item.quantity;
    }

    const orderNumber = 'HIT-' + Date.now().toString(36).toUpperCase();

    const order = await Order.create({
      orderNumber,
      customerName: String(customerName).slice(0, 200),
      customerPhone: String(customerPhone).slice(0, 30),
      customerEmail: customerEmail ? String(customerEmail).slice(0, 200) : null,
      deliveryAddress: deliveryAddress ? String(deliveryAddress).slice(0, 500) : null,
      deliveryCityRef: deliveryCityRef || null,
      deliveryWarehouseRef: deliveryWarehouseRef || null,
      deliveryCost: deliveryCost || 0,
      notes: notes ? String(notes).slice(0, 1000) : null,
      total: total + (parseFloat(deliveryCost) || 0),
      status: 'new',
      paymentStatus: 'pending',
      userId,
    }, { transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size ? String(item.size).slice(0, 10) : null,
        printNumber: item.printNumber ? String(item.printNumber).trim().slice(0, 10) : null,
        printName: item.printName ? String(item.printName).trim().slice(0, 40) : null,
        price: item._unitPrice,
      }, { transaction: t });

      const sizes = product.sizes || {};
      const hasSizes = Object.keys(sizes).length > 0;

      if (hasSizes && item.size) {
        const updatedSizes = { ...sizes, [item.size]: sizes[item.size] - item.quantity };
        const newStock = Object.values(updatedSizes).reduce((sum, qty) => sum + qty, 0);
        await product.update({ sizes: updatedSizes, stock: newStock }, { transaction: t });
      } else {
        await product.update({ stock: product.stock - item.quantity }, { transaction: t });
      }
    }

    await t.commit();

    if (userId) {
      try {
        const u = await User.findByPk(userId);
        if (u && !u.deliveryCity && req.body.city) {
          u.deliveryCity = String(req.body.city).slice(0, 200);
          u.deliveryWarehouse = req.body.warehouseNumber ? String(req.body.warehouseNumber).slice(0, 100) : null;
          await u.save();
        }
      } catch {}
    }

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });

    const emailItems = (fullOrder.items || []).map((i) => {
      const plain = typeof i.get === 'function' ? i.get({ plain: true }) : i;
      return {
        ...plain,
        printNumber: i.printNumber ?? plain.printNumber ?? null,
        printName: i.printName ?? plain.printName ?? null,
        Product: i.Product
          ? (typeof i.Product.get === 'function' ? i.Product.get({ plain: true }) : i.Product)
          : plain.Product || null,
      };
    });

    notifyNewOrder(fullOrder);
    sendOrderConfirmation(fullOrder, emailItems);

    res.status(201).json(fullOrder);
  } catch (err) {
    await t.rollback();
    console.error('Order create error:', err.message);
    res.status(500).json({ error: 'Помилка створення замовлення' });
  }
};

exports.getByOrderNumber = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { orderNumber: req.params.orderNumber },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'image'] }] }],
      attributes: ['id', 'orderNumber', 'customerName', 'total', 'status', 'paymentStatus', 'deliveryAddress', 'ttnNumber', 'deliveryCost', 'createdAt'],
    });
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Помилка' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Помилка завантаження замовлень' });
  }
};

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const ORDER_STATUS_UA = {
  new: 'нове',
  processing: 'в обробці',
  shipped: 'відправлено',
  delivered: 'доставлено',
  cancelled: 'скасовано',
};

const PAYMENT_STATUS_UA = {
  pending: 'очікує',
  paid: 'оплачено',
  failed: 'відхилено',
  refunded: 'повернено',
};

exports.exportCsv = async (req, res) => {
  try {
    const { preset, status, paymentStatus } = req.query;
    const where = {};

    if (preset === 'queue') {
      where.paymentStatus = 'paid';
      where.status = { [Op.in]: ['new', 'processing'] };
    } else if (preset === 'paid_new') {
      where.paymentStatus = 'paid';
      where.status = 'new';
    } else if (preset === 'paid_processing') {
      where.paymentStatus = 'paid';
      where.status = 'processing';
    } else {
      if (status) {
        const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
        if (statuses.length === 1) where.status = statuses[0];
        else if (statuses.length > 1) where.status = { [Op.in]: statuses };
      }
      if (paymentStatus) {
        const payments = String(paymentStatus).split(',').map((s) => s.trim()).filter(Boolean);
        if (payments.length === 1) where.paymentStatus = payments[0];
        else if (payments.length > 1) where.paymentStatus = { [Op.in]: payments };
      }
    }

    const orders = await Order.findAll({
      where,
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'ASC']],
    });

    const header = [
      'Номер замовлення',
      'Дата',
      'Статус замовлення',
      'Статус оплати',
      'ПІБ',
      'Телефон',
      'Email',
      'Адреса доставки',
      'ТТН',
      'Товар',
      'Розмір',
      'Номер набивки',
      'Текст набивки',
      'Кількість',
      'Ціна за од.',
      'Сума позиції',
      'Сума замовлення',
      'Доставка',
      'Примітки',
    ];

    const lines = [header.map(escapeCsv).join(',')];
    for (const order of orders) {
      const items = order.items?.length ? order.items : [null];
      for (const item of items) {
        const qty = item ? Number(item.quantity) || 0 : 0;
        const price = item ? Number(item.price) || 0 : 0;
        lines.push([
          order.orderNumber,
          order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA') : '',
          ORDER_STATUS_UA[order.status] || order.status,
          PAYMENT_STATUS_UA[order.paymentStatus] || order.paymentStatus,
          order.customerName || '',
          order.customerPhone || '',
          order.customerEmail || '',
          order.deliveryAddress || '',
          order.ttnNumber || '',
          item?.Product?.name || (item ? 'Товар' : ''),
          item?.size || '',
          item?.printNumber || '',
          item?.printName || '',
          item ? qty : '',
          item ? price.toFixed(2) : '',
          item ? (qty * price).toFixed(2) : '',
          Number(order.total).toFixed(2),
          Number(order.deliveryCost || 0).toFixed(2),
          order.notes || '',
        ].map(escapeCsv).join(','));
      }
    }

    const filename = `hitshop-shipping-${preset || 'orders'}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + lines.join('\n'));

    logAction(req, 'export', 'order', null, `CSV відправки (${orders.length} замовлень), preset=${preset || '-'}`);
  } catch (err) {
    console.error('Orders export error:', err.message);
    res.status(500).json({ error: 'Помилка експорту замовлень' });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Помилка завантаження замовлення' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });

    const role = req.adminRole || 'admin';
    const canOrderStatus = role === 'admin' || role === 'warehouse';
    const canPaymentStatus = role === 'admin' || role === 'accountant';
    const canTtn = role === 'admin' || role === 'warehouse';

    const { status, paymentStatus, ttnNumber } = req.body;
    const validStatuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPayment = ['pending', 'paid', 'failed', 'refunded'];

    if (status !== undefined && status !== null && status !== '') {
      if (!canOrderStatus) {
        return res.status(403).json({ error: 'Недостатньо прав для зміни статусу замовлення' });
      }
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Невірний статус' });
      }
    }
    if (paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== '') {
      if (!canPaymentStatus) {
        return res.status(403).json({ error: 'Недостатньо прав для зміни статусу оплати' });
      }
      if (!validPayment.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Невірний статус оплати' });
      }
    }
    if (ttnNumber !== undefined && !canTtn) {
      return res.status(403).json({ error: 'Недостатньо прав для зміни ТТН' });
    }

    if (status && canOrderStatus) order.status = status;
    if (paymentStatus && canPaymentStatus) order.paymentStatus = paymentStatus;
    if (ttnNumber !== undefined && canTtn) {
      order.ttnNumber = ttnNumber ? String(ttnNumber).slice(0, 50) : null;
    }
    await order.save();

    const changes = [];
    if (status && canOrderStatus) changes.push(`статус → ${status}`);
    if (paymentStatus && canPaymentStatus) changes.push(`оплата → ${paymentStatus}`);
    if (ttnNumber !== undefined && canTtn) changes.push(ttnNumber ? `ТТН → ${ttnNumber}` : 'ТТН видалено');
    if (changes.length) {
      logAction(req, 'update', 'order', order.id, `${order.orderNumber}: ${changes.join(', ')}`);
    }

    if (status && canOrderStatus) notifyStatusChange(order, 'status', status, req.adminUsername);
    if (paymentStatus && canPaymentStatus) notifyStatusChange(order, 'paymentStatus', paymentStatus, req.adminUsername);

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });
    res.json(fullOrder);
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
};

exports.remove = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: 'Замовлення не знайдено' });
    }

    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction: t,
    });

    const orderNumber = order.orderNumber;
    const ttnNumber = order.ttnNumber;
    const itemSummary = items
      .map((i) => `${i.productId}${i.size ? `(${i.size})` : ''}×${i.quantity}`)
      .join(', ');

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) continue;

      const sizes = product.sizes || {};
      const hasSizes = Object.keys(sizes).length > 0;

      if (hasSizes && item.size && sizes[item.size] !== undefined) {
        const updatedSizes = { ...sizes, [item.size]: sizes[item.size] + item.quantity };
        const newStock = Object.values(updatedSizes).reduce((sum, qty) => sum + qty, 0);
        await product.update({ sizes: updatedSizes, stock: newStock }, { transaction: t });
      } else {
        await product.update({ stock: product.stock + item.quantity }, { transaction: t });
      }
    }

    await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });
    await order.destroy({ transaction: t });
    await t.commit();

    logAction(
      req,
      'delete',
      'order',
      parseInt(req.params.id, 10),
      `Видалено замовлення ${orderNumber}` +
        (ttnNumber ? `, ТТН ${ttnNumber}` : '') +
        (itemSummary ? `; позиції: ${itemSummary}` : '')
    );

    res.json({ success: true, orderNumber });
  } catch (err) {
    await t.rollback();
    console.error('Order delete error:', err.message);
    res.status(500).json({ error: 'Помилка видалення замовлення' });
  }
};
