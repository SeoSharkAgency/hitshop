const cron = require('node-cron');
const { Order, OrderItem, Product } = require('./models');
const { Op } = require('sequelize');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

function notifyNewOrder(order) {
  const items = order.items?.map(i =>
    `  • ${i.Product?.name || 'товар'} ${i.size ? `(${i.size})` : ''} × ${i.quantity}`
  ).join('\n') || '';

  const text = `🛒 <b>Нове замовлення!</b>\n\n` +
    `<b>${order.orderNumber}</b>\n` +
    `👤 ${order.customerName}\n` +
    `📱 ${order.customerPhone}\n` +
    `${order.deliveryAddress ? `📦 ${order.deliveryAddress}\n` : ''}` +
    `${items ? `\n${items}\n` : ''}` +
    `\n💰 <b>${Number(order.total).toLocaleString('uk-UA')} ₴</b>`;

  sendMessage(text);
}

function notifyStatusChange(order, field, newValue) {
  const statusLabels = {
    new: 'нове',
    processing: 'в обробці',
    shipped: 'відправлено',
    delivered: 'доставлено',
    cancelled: 'скасовано',
  };
  const paymentLabels = {
    pending: 'очікує',
    paid: 'оплачено',
    failed: 'відхилено',
    refunded: 'повернено',
  };

  let emoji = '🔄';
  let label = newValue;

  if (field === 'status') {
    label = statusLabels[newValue] || newValue;
    if (newValue === 'shipped') emoji = '🚚';
    if (newValue === 'delivered') emoji = '✅';
    if (newValue === 'cancelled') emoji = '❌';
  } else if (field === 'paymentStatus') {
    label = paymentLabels[newValue] || newValue;
    if (newValue === 'paid') emoji = '💳';
    if (newValue === 'failed') emoji = '⚠️';
  }

  const text = `${emoji} <b>Статус змінено</b>\n\n` +
    `<b>${order.orderNumber}</b> — ${order.customerName}\n` +
    `${field === 'status' ? 'Статус' : 'Оплата'}: <b>${label}</b>`;

  sendMessage(text);
}

function startDailyReport() {
  if (!BOT_TOKEN || !CHAT_ID) return;

  // Every day at 9:00 AM Kyiv time (UTC+3 = 6:00 UTC)
  cron.schedule('0 6 * * *', async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      const newOrders = await Order.count({
        where: { createdAt: { [Op.gte]: todayStart } },
      });

      const awaitingShipment = await Order.count({
        where: {
          status: { [Op.in]: ['new', 'processing'] },
          paymentStatus: 'paid',
        },
      });

      const deliveredYesterday = await Order.count({
        where: {
          status: 'delivered',
          updatedAt: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart },
        },
      });

      const paidYesterday = await Order.count({
        where: {
          paymentStatus: 'paid',
          updatedAt: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart },
        },
      });

      const text = `📊 <b>Ранковий звіт</b>\n` +
        `${now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n` +
        `🆕 Нових замовлень сьогодні: <b>${newOrders}</b>\n` +
        `📦 Очікують відправки: <b>${awaitingShipment}</b>\n` +
        `✅ Доставлено вчора: <b>${deliveredYesterday}</b>\n` +
        `💳 Оплачено вчора: <b>${paidYesterday}</b>`;

      sendMessage(text);
    } catch (err) {
      console.error('Daily report error:', err.message);
    }
  });

  console.log('Telegram daily report scheduled (9:00 AM Kyiv)');
}

module.exports = { sendMessage, notifyNewOrder, notifyStatusChange, startDailyReport };
