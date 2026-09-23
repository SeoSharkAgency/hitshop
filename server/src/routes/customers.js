const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { User, Order, sequelize } = require('../models');
const { logAction } = require('../auditLog');

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customers = await User.findAll({
      attributes: {
        exclude: ['passwordHash'],
        include: [
          [
            sequelize.literal('(SELECT COUNT(*)::int FROM orders WHERE orders.user_id = users.id)'),
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

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!customer) return res.status(404).json({ error: 'Клієнта не знайдено' });

    const orders = await Order.findAll({
      where: { userId: customer.id },
      attributes: ['id', 'orderNumber', 'total', 'status', 'paymentStatus', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json({ ...customer.toJSON(), orders });
  } catch (err) {
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
