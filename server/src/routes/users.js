const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Order, OrderItem, Product } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'hitshop-secret-key';

function userAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Не авторизовано' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'user') return res.status(401).json({ error: 'Невірний токен' });
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Токен недійсний' });
  }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Вкажіть ім'я, email та пароль" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль мінімум 6 символів' });
    }
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Цей email вже зареєстрований' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).slice(0, 200),
      email: email.toLowerCase().slice(0, 200),
      phone: phone ? String(phone).slice(0, 30) : null,
      passwordHash: hash,
    });
    const token = jwt.sign({ id: user.id, type: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Помилка реєстрації' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Вкажіть email та пароль' });
    }
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }
    const token = jwt.sign({ id: user.id, type: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: 'Помилка входу' });
  }
});

router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['id', 'name', 'email', 'phone', 'deliveryCity', 'deliveryWarehouse'] });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Помилка' });
  }
});

router.put('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    const { name, phone, deliveryCity, deliveryWarehouse } = req.body;
    if (name) user.name = String(name).slice(0, 200);
    if (phone !== undefined) user.phone = phone ? String(phone).slice(0, 30) : null;
    if (deliveryCity !== undefined) user.deliveryCity = deliveryCity ? String(deliveryCity).slice(0, 200) : null;
    if (deliveryWarehouse !== undefined) user.deliveryWarehouse = deliveryWarehouse ? String(deliveryWarehouse).slice(0, 100) : null;
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, deliveryCity: user.deliveryCity, deliveryWarehouse: user.deliveryWarehouse });
  } catch {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
});

router.get('/orders', userAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.userId },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'image', 'price'] }] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Помилка завантаження замовлень' });
  }
});

router.userAuth = userAuth;
module.exports = router;
