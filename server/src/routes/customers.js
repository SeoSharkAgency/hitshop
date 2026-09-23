const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { User, Order, OrderItem, Product, sequelize } = require('../models');
const { logAction } = require('../auditLog');

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildOrderWhere(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt[Op.gte] = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = to;
    }
  }
  return where;
}

function hasPurchaseFilters(query) {
  return !!(
    query.productId
    || query.categoryId
    || (query.productQ && String(query.productQ).trim())
    || query.status
    || query.paymentStatus
    || query.dateFrom
    || query.dateTo
    || query.hasOrders === '1'
    || query.hasOrders === 'true'
  );
}

async function findMatchingOrders(query) {
  const productWhere = {};
  if (query.productId) productWhere.id = parseInt(query.productId, 10);
  if (query.categoryId) productWhere.categoryId = parseInt(query.categoryId, 10);
  if (query.productQ && String(query.productQ).trim()) {
    productWhere.name = { [Op.iLike]: `%${String(query.productQ).trim()}%` };
  }

  const needProductJoin = !!(query.productId || query.categoryId || (query.productQ && String(query.productQ).trim()));

  return Order.findAll({
    where: buildOrderWhere(query),
    attributes: ['id', 'userId', 'customerEmail', 'customerName', 'customerPhone', 'orderNumber', 'total', 'status', 'paymentStatus', 'createdAt'],
    include: [{
      model: OrderItem,
      as: 'items',
      required: needProductJoin,
      include: [{
        model: Product,
        attributes: ['id', 'name', 'categoryId'],
        required: needProductJoin,
        where: needProductJoin ? productWhere : undefined,
      }],
    }],
  });
}

async function resolveCustomersFromOrders(orders) {
  const userIds = new Set();
  const emails = new Set();

  for (const order of orders) {
    if (order.userId) userIds.add(order.userId);
    if (order.customerEmail) emails.add(String(order.customerEmail).toLowerCase());
  }

  const or = [];
  if (userIds.size) or.push({ id: { [Op.in]: [...userIds] } });
  if (emails.size) or.push({ email: { [Op.in]: [...emails] } });
  if (!or.length) return [];

  return User.findAll({
    attributes: { exclude: ['passwordHash'] },
    where: { [Op.or]: or },
    order: [['createdAt', 'DESC']],
  });
}

function summarizeMatchedProducts(orders, user) {
  const names = new Set();
  const email = user.email ? String(user.email).toLowerCase() : null;
  for (const order of orders) {
    const linked =
      (order.userId && order.userId === user.id)
      || (email && order.customerEmail && String(order.customerEmail).toLowerCase() === email);
    if (!linked) continue;
    for (const item of order.items || []) {
      if (item.Product?.name) names.add(item.Product.name);
    }
  }
  return [...names].join('; ');
}

function customerOrdersStats(orders, user) {
  const email = user.email ? String(user.email).toLowerCase() : null;
  let count = 0;
  let totalSpent = 0;
  const lastDates = [];
  for (const order of orders) {
    const linked =
      (order.userId && order.userId === user.id)
      || (email && order.customerEmail && String(order.customerEmail).toLowerCase() === email);
    if (!linked) continue;
    count += 1;
    totalSpent += parseFloat(order.total) || 0;
    if (order.createdAt) lastDates.push(new Date(order.createdAt));
  }
  lastDates.sort((a, b) => b - a);
  return {
    ordersCount: count,
    totalSpent,
    lastOrderAt: lastDates[0] || null,
  };
}

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    if (hasPurchaseFilters(req.query) && req.query.hasOrders !== '0') {
      const orders = await findMatchingOrders(req.query);
      let customers = await resolveCustomersFromOrders(orders);

      if (req.query.hasOrders === '1' || req.query.hasOrders === 'true' || hasPurchaseFilters(req.query)) {
        // already filtered to those with matching orders
      }

      const enriched = customers.map((c) => {
        const stats = customerOrdersStats(orders, c);
        return {
          ...c.toJSON(),
          ordersCount: stats.ordersCount,
          totalSpent: stats.totalSpent,
          matchedProducts: summarizeMatchedProducts(orders, c),
        };
      });
      return res.json(enriched);
    }

    const customers = await User.findAll({
      attributes: {
        exclude: ['passwordHash'],
        include: [
          [
            sequelize.literal('(SELECT COUNT(*)::int FROM orders WHERE orders.user_id = "User".id OR (orders.customer_email IS NOT NULL AND lower(orders.customer_email) = lower("User".email)))'),
            'ordersCount',
          ],
        ],
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(customers);
  } catch (err) {
    console.error('Customers list error:', err.message);
    res.status(500).json({ error: 'Помилка завантаження клієнтів' });
  }
});

router.get('/export', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    let customers;
    let orders = [];

    if (hasPurchaseFilters(req.query)) {
      orders = await findMatchingOrders(req.query);
      customers = await resolveCustomersFromOrders(orders);
    } else {
      customers = await User.findAll({
        attributes: { exclude: ['passwordHash'] },
        order: [['createdAt', 'DESC']],
      });
      orders = await findMatchingOrders({});
    }

    const header = [
      'ID',
      'Ім\'я',
      'Email',
      'Телефон',
      'Місто',
      'Відділення НП',
      'К-сть замовлень',
      'Сума покупок',
      'Останнє замовлення',
      'Товари (фільтр/історія)',
      'Дата реєстрації',
    ];

    const lines = [header.map(escapeCsv).join(',')];
    for (const c of customers) {
      const stats = customerOrdersStats(orders, c);
      const products = summarizeMatchedProducts(orders, c);
      lines.push([
        c.id,
        c.name,
        c.email,
        c.phone || '',
        c.deliveryCity || '',
        c.deliveryWarehouse || '',
        stats.ordersCount,
        stats.totalSpent.toFixed(2),
        stats.lastOrderAt ? stats.lastOrderAt.toISOString().slice(0, 10) : '',
        products,
        c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
      ].map(escapeCsv).join(','));
    }

    const filename = `hitshop-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + lines.join('\n'));

    logAction(req, 'export', 'customer', null, `CSV клієнтів (${customers.length}), фільтри: ${JSON.stringify(req.query)}`);
  } catch (err) {
    console.error('Customers export error:', err.message);
    res.status(500).json({ error: 'Помилка експорту клієнтів' });
  }
});

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!customer) return res.status(404).json({ error: 'Клієнта не знайдено' });

    const orders = await Order.findAll({
      where: {
        [Op.or]: [
          { userId: customer.id },
          ...(customer.email
            ? [{ customerEmail: { [Op.iLike]: customer.email } }]
            : []),
        ],
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, attributes: ['id', 'name', 'image'] }],
      }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json({ ...customer.toJSON(), orders });
  } catch (err) {
    console.error('Customer detail error:', err.message);
    res.status(500).json({ error: 'Помилка завантаження клієнта' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Клієнта не знайдено' });

    const name = customer.name;
    const email = customer.email;

    await Order.update({ userId: null }, { where: { userId: customer.id } });
    await customer.destroy();

    logAction(req, 'delete', 'customer', req.params.id, `Видалено клієнта "${name}" (${email})`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Customer delete error:', err.message);
    res.status(500).json({ error: 'Помилка видалення клієнта' });
  }
});

module.exports = router;
