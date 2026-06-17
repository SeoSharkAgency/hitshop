require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Product, Category, Admin } = require('./models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    const hash = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', passwordHash: hash });
    console.log('Admin user created (admin / admin123)');

    const categories = await Category.bulkCreate([
      { name: 'Ігрова форма', slug: 'forma' },
      { name: 'Тренувальний одяг', slug: 'training' },
      { name: 'Аксесуари', slug: 'accessories' },
      { name: 'Шарфи та атрибутика', slug: 'scarves' },
      { name: 'Верхній одяг', slug: 'outerwear' },
    ]);
    console.log('Categories created.');

    await Product.bulkCreate([
      {
        name: 'Домашня футболка ХІТ 2024/25',
        description: 'Офіційна домашня ігрова футболка ФК "Хіт" Київ сезону 2024/25. Жовтий колір з темно-синіми акцентами. Дихаючий матеріал.',
        price: 1200,
        image: null,
        category_id: categories[0].id,
        sizes: { 'XS': 5, 'S': 10, 'M': 15, 'L': 10, 'XL': 7, 'XXL': 3 },
        stock: 50,
        featured: true,
      },
      {
        name: 'Гостьова футболка ХІТ 2024/25',
        description: 'Офіційна гостьова ігрова футболка ФК "Хіт" Київ сезону 2024/25. Темно-синій колір з золотими деталями.',
        price: 1200,
        image: null,
        category_id: categories[0].id,
        sizes: { 'XS': 4, 'S': 8, 'M': 12, 'L': 8, 'XL': 5, 'XXL': 3 },
        stock: 40,
        featured: true,
      },
      {
        name: 'Шорти ігрові ХІТ',
        description: 'Офіційні ігрові шорти ФК "Хіт" Київ. Легкий та зручний матеріал для максимального комфорту.',
        price: 650,
        image: null,
        category_id: categories[0].id,
        sizes: { 'S': 15, 'M': 20, 'L': 15, 'XL': 10 },
        stock: 60,
        featured: false,
      },
      {
        name: 'Тренувальна футболка',
        description: 'Тренувальна футболка з символікою ФК "Хіт". Спортивний крій, відведення вологи.',
        price: 800,
        image: null,
        category_id: categories[1].id,
        sizes: { 'S': 6, 'M': 8, 'L': 8, 'XL': 5, 'XXL': 3 },
        stock: 30,
        featured: true,
      },
      {
        name: 'Спортивні штани ХІТ',
        description: 'Спортивні штани з вишитим логотипом клубу. Ідеальні для тренувань та повсякденного носіння.',
        price: 950,
        image: null,
        category_id: categories[1].id,
        sizes: { 'S': 5, 'M': 8, 'L': 7, 'XL': 5 },
        stock: 25,
        featured: false,
      },
      {
        name: 'Шарф ФК "Хіт"',
        description: 'В\'язаний шарф уболівальника з написом "ХІТ КИЇВ". Жовто-синя кольорова гама.',
        price: 350,
        image: null,
        category_id: categories[3].id,
        sizes: {},
        stock: 100,
        featured: true,
      },
      {
        name: 'Кепка ХІТ',
        description: 'Бейсболка з вишитим логотипом ФК "Хіт". Регульований розмір.',
        price: 450,
        image: null,
        category_id: categories[2].id,
        sizes: { 'One Size': 80 },
        stock: 80,
        featured: false,
      },
      {
        name: 'Рюкзак ХІТ',
        description: 'Спортивний рюкзак з символікою клубу. Вмістка основна секція, кишеня для ноутбука.',
        price: 1500,
        image: null,
        category_id: categories[2].id,
        sizes: {},
        stock: 20,
        featured: true,
      },
      {
        name: 'Куртка зимова ХІТ',
        description: 'Тепла зимова куртка з логотипом ФК "Хіт". Водовідштовхувальна тканина, утеплювач.',
        price: 3200,
        image: null,
        category_id: categories[4].id,
        sizes: { 'S': 2, 'M': 4, 'L': 4, 'XL': 3, 'XXL': 2 },
        stock: 15,
        featured: true,
      },
    ]);
    console.log('Products created.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
