const { Order, OrderItem, Product, sequelize } = require('../models');

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customerName, customerPhone, customerEmail, deliveryAddress, deliveryCityRef, deliveryWarehouseRef, deliveryCost, notes, items } = req.body;

    if (!customerName || !customerPhone) {
      await t.rollback();
      return res.status(400).json({ error: "Вкажіть ім'я та телефон" });
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

      total += parseFloat(product.price) * item.quantity;
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
    }, { transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size ? String(item.size).slice(0, 10) : null,
        price: product.price,
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

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });

    res.status(201).json(fullOrder);
  } catch (err) {
    await t.rollback();
    console.error('Order create error:', err.message);
    res.status(500).json({ error: 'Помилка створення замовлення' });
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

    const { status, paymentStatus, ttnNumber } = req.body;
    const validStatuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPayment = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Невірний статус' });
    }
    if (paymentStatus && !validPayment.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Невірний статус оплати' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (ttnNumber) order.ttnNumber = String(ttnNumber).slice(0, 50);
    await order.save();

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
    });
    res.json(fullOrder);
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
};
