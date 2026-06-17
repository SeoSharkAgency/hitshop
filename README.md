# HIT Shop — Інтернет-магазин ФК "Хіт" Київ

Інтернет-магазин спортивної атрибутики футзального клубу "Хіт" Київ.

## Технології

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL
- **Payments**: WayForPay

## Запуск

### Prerequisites

- Node.js 18+
- PostgreSQL

### Backend

```bash
cd server
cp .env.example .env
# відредагуйте .env з вашими даними
npm install
npm run seed   # створення таблиць та тестових даних
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Магазин буде доступний на http://localhost:5173

### Адмін-панель

Перейдіть на http://localhost:5173/admin

Логін за замовчуванням:
- **Username**: admin
- **Password**: admin123
