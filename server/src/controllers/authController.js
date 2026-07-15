const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const AuditLog = require('../models/AuditLog');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: admin.username, role: admin.role });

    AuditLog.create({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'login',
      entity: 'auth',
      details: `Вхід у систему (${admin.role})`,
      ip: req.ip || null,
    }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.adminId, {
      attributes: ['id', 'username', 'role'],
    });
    if (!admin) return res.status(404).json({ error: 'Адмін не знайдено' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
