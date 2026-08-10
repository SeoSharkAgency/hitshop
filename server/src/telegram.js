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
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

function getOrderTrackingUrl(orderNumber) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${clientUrl}/order/${orderNumber}`;
}

function notifyNewOrder(order) {
  const items = order.items?.map(i =>
    `  • ${i.Product?.name || 'товар'} ${i.size ? `(${i.size})` : ''} × ${i.quantity}`
  ).join('\n') || '';

  const trackingUrl = getOrderTrackingUrl(order.orderNumber);

  const text = `🛒 <b>Нове замовлення!</b>\n\n` +
    `<b>${order.orderNumber}</b>\n` +
    `👤 ${order.customerName}\n` +
    `📱 ${order.customerPhone}\n` +
    `${order.customerEmail ? `✉️ ${order.customerEmail}\n` : ''}` +
    `${order.deliveryAddress ? `📦 ${order.deliveryAddress}\n` : ''}` +
    `${items ? `\n${items}\n` : ''}` +
    `\n💰 <b>${Number(order.total).toLocaleString('uk-UA')} ₴</b>\n\n` +
    `🔗 <a href="${trackingUrl}">Відстежити замовлення</a>`;

  sendMessage(text);
}

function notifyStatusChange(order, field, newValue, changedBy) {
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
  let fieldName = 'Статус';

  if (field === 'status') {
    label = statusLabels[newValue] || newValue;
    if (newValue === 'shipped') emoji = '🚚';
    if (newValue === 'delivered') emoji = '✅';
    if (newValue === 'cancelled') emoji = '❌';
  } else if (field === 'paymentStatus') {
    label = paymentLabels[newValue] || newValue;
    fieldName = 'Оплата';
    if (newValue === 'paid') emoji = '💳';
    if (newValue === 'failed') emoji = '⚠️';
  } else if (field === 'delivery') {
    emoji = '📬';
    label = newValue;
    fieldName = 'Доставка';
  }

  const text = `${emoji} <b>Статус змінено</b>\n\n` +
    `<b>${order.orderNumber}</b> — ${order.customerName}\n` +
    `${fieldName}: <b>${label}</b>\n` +
    `👤 Змінив: <b>${changedBy || 'система'}</b>`;

  sendMessage(text);
}

function startDailyReport() {
  if (!BOT_TOKEN || !CHAT_ID) return;

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

  cron.schedule('*/30 * * * *', async () => {
    await checkDeliveryStatuses();
  });

  console.log('Telegram daily report scheduled (9:00 AM Kyiv)');
  console.log('NP delivery status check scheduled (every 30 min)');
}

async function checkDeliveryStatuses() {
  try {
    const orders = await Order.findAll({
      where: {
        ttnNumber: { [Op.ne]: null, [Op.ne]: '' },
        status: { [Op.in]: ['shipped', 'processing'] },
      },
    });

    if (orders.length === 0) return;

    const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';
    const apiKey = process.env.NOVAPOSHTA_API_KEY;
    if (!apiKey) return;

    const documents = orders.map(o => ({ DocumentNumber: o.ttnNumber, Phone: '' }));

    const response = await fetch(NP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: { Documents: documents },
      }),
    });

    const result = await response.json();
    if (!result.success || !result.data) return;

    const STATUS_MAP = {
      '2': 'cancelled',
      '4': 'shipped',
      '5': 'shipped',
      '6': 'shipped',
      '7': 'shipped',
      '9': 'delivered',
      '10': 'delivered',
      '11': 'delivered',
      '14': 'delivered',
      '101': 'shipped',
      '102': 'shipped',
      '103': 'shipped',
      '108': 'cancelled',
    };

    for (const doc of result.data) {
      const order = orders.find(o => o.ttnNumber === doc.Number);
      if (!order) continue;

      const newStatus = STATUS_MAP[String(doc.StatusCode)];
      if (newStatus && order.status !== newStatus) {
        order.status = newStatus;
        await order.save();
        notifyStatusChange(order, 'delivery', `${doc.Status}`, 'Нова Пошта (авто)');
      }
    }
  } catch (err) {
    console.error('NP status check error:', err.message);
  }
}

module.exports = { sendMessage, notifyNewOrder, notifyStatusChange, startDailyReport, checkDeliveryStatuses };
