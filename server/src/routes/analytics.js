const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Order, OrderItem, Product, Category, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { logAction } = require('../auditLog');

router.use(auth, requireRole('admin', 'accountant'));

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatOrderItem(item) {
  const parts = [
    item.Product?.name || 'Товар',
    item.size ? `розмір ${item.size}` : null,
    item.printNumber ? `№${item.printNumber}` : null,
    item.printName ? `набивка «${item.printName}»` : null,
    `×${item.quantity}`,
    `${Number(item.price).toFixed(2)} ₴`,
  ].filter(Boolean);
  return parts.join(' · ');
}

function dayKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabelUa(date) {
  return new Date(date).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDateRange(period, customFrom, customTo) {
  const now = new Date();
  let from, to;
  to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'week':
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3months':
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case '6months':
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), 0, 1);
      to = customTo ? new Date(customTo + 'T23:59:59.999') : to;
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { from, to };
}

router.get('/summary', async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const where = { createdAt: { [Op.between]: [from, to] } };
    const whereSuccess = { ...where, status: { [Op.notIn]: ['cancelled'] } };

    const totalOrders = await Order.count({ where });
    const successOrders = await Order.count({ where: whereSuccess });
    const cancelledOrders = await Order.count({ where: { ...where, status: 'cancelled' } });

    const revenueResult = await Order.findOne({
      where: whereSuccess,
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total')), 0), 'revenue']],
      raw: true,
    });

    const paidWhere = { ...where, paymentStatus: 'paid' };
    const paidOrders = await Order.count({ where: paidWhere });
    const paidRevenueResult = await Order.findOne({
      where: paidWhere,
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total')), 0), 'paidRevenue']],
      raw: true,
    });

    const itemsResult = await sequelize.query(`
      SELECT COALESCE(SUM(oi.quantity), 0) as total
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o."createdAt" BETWEEN :from AND :to
        AND o.status != 'cancelled'
    `, {
      replacements: { from, to },
      type: sequelize.QueryTypes.SELECT,
    });

    const avgCheck = successOrders > 0 ? (parseFloat(revenueResult.revenue) / successOrders) : 0;

    res.json({
      totalOrders,
      successOrders,
      cancelledOrders,
      paidOrders,
      paidRevenue: parseFloat(paidRevenueResult?.paidRevenue) || 0,
      revenue: parseFloat(revenueResult.revenue) || 0,
      itemsSold: parseInt(itemsResult[0]?.total) || 0,
      avgCheck: Math.round(avgCheck),
      period,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (err) {
    console.error('Analytics summary error:', err.message);
    res.status(500).json({ error: 'Помилка аналітики' });
  }
});

router.get('/chart', async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    let groupBy, dateFormat;

    if (diffDays <= 31) {
      groupBy = 'day';
      dateFormat = 'YYYY-MM-DD';
    } else if (diffDays <= 180) {
      groupBy = 'week';
      dateFormat = 'IYYY-IW';
    } else {
      groupBy = 'month';
      dateFormat = 'YYYY-MM';
    }

    const results = await sequelize.query(`
      SELECT 
        TO_CHAR("createdAt", :dateFormat) as period,
        COUNT(*) as orders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM orders
      WHERE "createdAt" BETWEEN :from AND :to
      GROUP BY TO_CHAR("createdAt", :dateFormat)
      ORDER BY period ASC
    `, {
      replacements: { dateFormat, from, to },
      type: sequelize.QueryTypes.SELECT,
    });

    const chart = results.map(r => ({
      period: r.period,
      orders: parseInt(r.orders),
      revenue: parseFloat(r.revenue),
      cancelled: parseInt(r.cancelled),
    }));

    res.json({ groupBy, data: chart });
  } catch (err) {
    console.error('Analytics chart error:', err.message);
    res.status(500).json({ error: 'Помилка графіку' });
  }
});

router.get('/top-products', async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo, limit = 10 } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const results = await sequelize.query(`
      SELECT 
        oi.product_id as "productId",
        p.name,
        c.name as category,
        SUM(oi.quantity) as "totalQty",
        SUM(oi.quantity * oi.price) as "totalRevenue",
        COUNT(DISTINCT oi.order_id) as "orderCount"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o."createdAt" BETWEEN :from AND :to
        AND o.status != 'cancelled'
      GROUP BY oi.product_id, p.name, c.name
      ORDER BY "totalRevenue" DESC
      LIMIT :limit
    `, {
      replacements: { from, to, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    res.json(results.map(r => ({
      productId: r.productId,
      name: r.name,
      category: r.category,
      totalQty: parseInt(r.totalQty),
      totalRevenue: parseFloat(r.totalRevenue),
      orderCount: parseInt(r.orderCount),
    })));
  } catch (err) {
    console.error('Top products error:', err.message);
    res.status(500).json({ error: 'Помилка' });
  }
});

router.get('/top-sizes', async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const results = await sequelize.query(`
      SELECT 
        oi.size,
        SUM(oi.quantity) as "totalQty",
        COUNT(DISTINCT oi.order_id) as "orderCount"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o."createdAt" BETWEEN :from AND :to
        AND o.status != 'cancelled'
        AND oi.size IS NOT NULL
      GROUP BY oi.size
      ORDER BY "totalQty" DESC
    `, {
      replacements: { from, to },
      type: sequelize.QueryTypes.SELECT,
    });

    res.json(results.map(r => ({
      size: r.size,
      totalQty: parseInt(r.totalQty),
      orderCount: parseInt(r.orderCount),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Помилка' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const results = await sequelize.query(`
      SELECT 
        c.name as category,
        SUM(oi.quantity) as "totalQty",
        SUM(oi.quantity * oi.price) as "totalRevenue"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o."createdAt" BETWEEN :from AND :to
        AND o.status != 'cancelled'
      GROUP BY c.name
      ORDER BY "totalRevenue" DESC
    `, {
      replacements: { from, to },
      type: sequelize.QueryTypes.SELECT,
    });

    res.json(results.map(r => ({
      category: r.category || 'Без категорії',
      totalQty: parseInt(r.totalQty),
      totalRevenue: parseFloat(r.totalRevenue),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Помилка' });
  }
});

router.get('/recent-orders', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['name'] }] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Помилка' });
  }
});

/** Daily paid orders for boss report (admin only) */
router.get('/boss-daily', requireRole('admin'), async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const orders = await Order.findAll({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.between]: [from, to] },
      },
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'ASC']],
    });

    const byDay = {};
    for (const order of orders) {
      const key = dayKey(order.createdAt);
      if (!byDay[key]) {
        byDay[key] = {
          day: key,
          dayLabel: dayLabelUa(order.createdAt),
          ordersCount: 0,
          totalSum: 0,
          orders: [],
        };
      }
      const total = parseFloat(order.total) || 0;
      byDay[key].ordersCount += 1;
      byDay[key].totalSum += total;
      byDay[key].orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddress: order.deliveryAddress,
        ttnNumber: order.ttnNumber,
        total,
        deliveryCost: parseFloat(order.deliveryCost) || 0,
        notes: order.notes,
        createdAt: order.createdAt,
        items: (order.items || []).map((item) => ({
          name: item.Product?.name || 'Товар',
          size: item.size,
          printNumber: item.printNumber,
          printName: item.printName,
          quantity: item.quantity,
          price: parseFloat(item.price) || 0,
          line: formatOrderItem(item),
        })),
      });
    }

    const days = Object.keys(byDay).sort().map((k) => ({
      ...byDay[k],
      totalSum: Math.round(byDay[k].totalSum * 100) / 100,
    }));

    res.json({
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      paidOrders: orders.length,
      paidRevenue: days.reduce((s, d) => s + d.totalSum, 0),
      days,
    });
  } catch (err) {
    console.error('Boss daily error:', err.message);
    res.status(500).json({ error: 'Помилка звіту' });
  }
});

/** CSV: day + paid orders in shipping-style format (admin only) */
router.get('/boss-report', requireRole('admin'), async (req, res) => {
  try {
    const { period = 'month', from: customFrom, to: customTo } = req.query;
    const { from, to } = getDateRange(period, customFrom, customTo);

    const orders = await Order.findAll({
      where: {
        paymentStatus: 'paid',
        createdAt: { [Op.between]: [from, to] },
      },
      include: [{ model: OrderItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'ASC']],
    });

    const byDay = {};
    for (const order of orders) {
      const key = dayKey(order.createdAt);
      if (!byDay[key]) byDay[key] = { count: 0, sum: 0 };
      byDay[key].count += 1;
      byDay[key].sum += parseFloat(order.total) || 0;
    }

    const periodLabel = period === 'custom'
      ? `${customFrom || ''} — ${customTo || ''}`
      : period;
    const paidRevenue = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

    const lines = ['\ufeff'];
    lines.push('ЗВІТ ДЛЯ ШЕФА — ОПЛАЧЕНІ ЗАМОВЛЕННЯ');
    lines.push(`Період:,${periodLabel}`);
    lines.push(`Від:,${from.toLocaleString('uk-UA')}`);
    lines.push(`До:,${to.toLocaleString('uk-UA')}`);
    lines.push(`Оплачених замовлень:,${orders.length}`);
    lines.push(`Сума оплачених:,${paidRevenue.toFixed(2)} ₴`);
    lines.push('');
    lines.push('ПІДСУМОК ПО ДНЯХ');
    lines.push(['День', 'К-сть оплачених', 'Сума'].map(escapeCsv).join(','));
    for (const key of Object.keys(byDay).sort()) {
      lines.push([
        dayLabelUa(`${key}T12:00:00`),
        byDay[key].count,
        byDay[key].sum.toFixed(2),
      ].map(escapeCsv).join(','));
    }
    lines.push('');
    lines.push('ОПЛАЧЕНІ ЗАМОВЛЕННЯ ПО ДНЯХ');
    lines.push([
      'День',
      'Номер замовлення',
      'Дата/час',
      'ПІБ',
      'Телефон',
      'Email',
      'Адреса доставки',
      'ТТН',
      'К-сть позицій',
      'Товари та параметри',
      'Сума замовлення',
      'Доставка',
      'Примітки',
    ].map(escapeCsv).join(','));

    for (const order of orders) {
      const items = order.items || [];
      const itemsText = items.map((item, i) => `${i + 1}) ${formatOrderItem(item)}`).join('\n');
      lines.push([
        dayLabelUa(order.createdAt),
        order.orderNumber,
        order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA') : '',
        order.customerName || '',
        order.customerPhone || '',
        order.customerEmail || '',
        order.deliveryAddress || '',
        order.ttnNumber || '',
        items.length,
        itemsText,
        Number(order.total).toFixed(2),
        Number(order.deliveryCost || 0).toFixed(2),
        order.notes || '',
      ].map(escapeCsv).join(','));
    }

    const filename = `hitshop-boss-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(lines.join('\n'));

    logAction(req, 'export', 'order', null, `CSV звіт для шефа (${orders.length} оплачених), period=${period}`);
  } catch (err) {
    console.error('Boss report error:', err.message);
    res.status(500).json({ error: 'Помилка експорту звіту' });
  }
});

module.exports = router;
