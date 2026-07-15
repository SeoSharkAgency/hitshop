const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Order, OrderItem, Product, Category, sequelize } = require('../models');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin', 'accountant'));

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

    const paidOrders = await Order.count({ where: { ...where, paymentStatus: 'paid' } });

    const itemsSold = await OrderItem.findOne({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quantity')), 0), 'total']],
      include: [{ model: Order, attributes: [], where: whereSuccess }],
      raw: true,
    });

    const avgCheck = successOrders > 0 ? (parseFloat(revenueResult.revenue) / successOrders) : 0;

    res.json({
      totalOrders,
      successOrders,
      cancelledOrders,
      paidOrders,
      revenue: parseFloat(revenueResult.revenue) || 0,
      itemsSold: parseInt(itemsSold.total) || 0,
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
        TO_CHAR("created_at", :dateFormat) as period,
        COUNT(*) as orders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM orders
      WHERE "created_at" BETWEEN :from AND :to
      GROUP BY TO_CHAR("created_at", :dateFormat)
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
      WHERE o.created_at BETWEEN :from AND :to
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
      WHERE o.created_at BETWEEN :from AND :to
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
      WHERE o.created_at BETWEEN :from AND :to
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

module.exports = router;
