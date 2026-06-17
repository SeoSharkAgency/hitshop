const { Product, Category } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.category) {
      const category = await Category.findOne({ where: { slug: req.query.category } });
      if (category) where.categoryId = category.id;
    }
    if (req.query.featured === 'true') {
      where.featured = true;
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
    });
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, categoryId, sizes, stock, featured } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    let parsedSizes = {};
    if (sizes) {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => { parsedSizes[s] = parseInt(stock) || 0; });
      } else {
        parsedSizes = parsed;
      }
    }

    const totalStock = Object.keys(parsedSizes).length > 0
      ? Object.values(parsedSizes).reduce((sum, qty) => sum + qty, 0)
      : (parseInt(stock) || 0);

    const product = await Product.create({
      name,
      description,
      price,
      categoryId,
      sizes: parsedSizes,
      stock: totalStock,
      featured: featured === 'true',
      image,
    });

    const full = await Product.findByPk(product.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: 'Помилка створення товару' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });

    const { name, description, price, categoryId, sizes, stock, featured } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = price;
    if (categoryId) updateData.categoryId = categoryId;
    if (sizes) {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) {
        const obj = {};
        parsed.forEach(s => { obj[s] = parseInt(stock) || 0; });
        updateData.sizes = obj;
      } else {
        updateData.sizes = parsed;
      }
      updateData.stock = Object.values(updateData.sizes).reduce((sum, qty) => sum + qty, 0);
    } else if (stock !== undefined) {
      updateData.stock = parseInt(stock);
    }
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    await product.update(updateData);

    const full = await Product.findByPk(product.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення товару' });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
    await product.destroy();
    res.json({ message: 'Товар видалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
