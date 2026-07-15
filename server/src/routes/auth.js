const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { Admin, AuditLog } = require('../models');
const { logAction } = require('../auditLog');

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await Admin.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] });
    res.json(users);
  } catch { res.status(500).json({ error: 'Помилка' }); }
});

router.post('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Вкажіть логін та пароль' });
    const validRoles = ['admin', 'accountant', 'warehouse'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Невірна роль' });
    const existing = await Admin.findOne({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Такий логін вже існує' });
    const hash = await bcrypt.hash(password, 10);
    const user = await Admin.create({ username, passwordHash: hash, role: role || 'warehouse' });
    logAction(req, 'create', 'user', user.id, `Створено користувача "${username}" (${role || 'warehouse'})`);
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch { res.status(500).json({ error: 'Помилка створення' }); }
});

router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.adminId) return res.status(400).json({ error: 'Не можна видалити себе' });
    const user = await Admin.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не знайдено' });
    const deletedName = user.username;
    await user.destroy();
    logAction(req, 'delete', 'user', parseInt(req.params.id), `Видалено користувача "${deletedName}"`);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Помилка' }); }
});

router.get('/logs', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { entity, limit } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit) || 100,
    });
    res.json(logs);
  } catch { res.status(500).json({ error: 'Помилка' }); }
});

module.exports = router;
