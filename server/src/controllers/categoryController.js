const { Op } = require('sequelize');
const { Category, Product, sequelize } = require('../models');

exports.getAll = async (req, res) => {
  try {
    // Адмінка: ?all=1 — усі категорії; каталог — лише з товарами
    if (req.query.all === '1' || req.query.all === 'true') {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      return res.json(categories);
    }

    const rows = await Product.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category_id')), 'categoryId']],
      raw: true,
    });
    const ids = rows.map((r) => r.categoryId).filter((id) => id != null);
    const categories = await Category.findAll({
      where: { id: { [Op.in]: ids.length ? ids : [0] } },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const category = await Category.create({ name, slug });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
