const { Product, Category } = require('../models');
const { logAction } = require('../auditLog');

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
    logAction(req, 'create', 'product', product.id, `Створено товар "${name}"`);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: 'Помилка створення товару' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });

    const oldSizes = product.sizes || {};
    const oldStock = product.stock;

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

    const newSizes = updateData.sizes || oldSizes;
    const newStock = updateData.stock !== undefined ? updateData.stock : oldStock;
    const stockChanges = [];

    if (updateData.sizes) {
      const allKeys = new Set([...Object.keys(oldSizes), ...Object.keys(newSizes)]);
      for (const size of allKeys) {
        const oldQty = oldSizes[size] ?? 0;
        const newQty = newSizes[size] ?? 0;
        if (oldQty !== newQty) {
          const diff = newQty - oldQty;
          stockChanges.push(`${size}: ${oldQty} → ${newQty} (${diff > 0 ? '+' : ''}${diff})`);
        }
      }
    } else if (updateData.stock !== undefined && updateData.stock !== oldStock) {
      const diff = newStock - oldStock;
      stockChanges.push(`загалом: ${oldStock} → ${newStock} (${diff > 0 ? '+' : ''}${diff})`);
    }

    if (stockChanges.length > 0) {
      logAction(req, 'stock_change', 'product', product.id,
        `"${product.name}" — залишки: ${stockChanges.join(', ')}`);
    }

    logAction(req, 'update', 'product', product.id, `Оновлено товар "${product.name}"`);

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
    const productName = product.name;
    await product.destroy();
    logAction(req, 'delete', 'product', parseInt(req.params.id), `Видалено товар "${productName}"`);
    res.json({ message: 'Товар видалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
