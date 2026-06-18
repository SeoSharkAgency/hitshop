const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { Order } = require('../models');

function generateSignature(params, secretKey) {
  const signString = params.join(';');
  return crypto.createHmac('md5', secretKey).update(signString).digest('hex');
}

router.post('/create', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });

    const merchantLogin = process.env.WAYFORPAY_MERCHANT_LOGIN;
    const merchantSecret = process.env.WAYFORPAY_MERCHANT_SECRET;
    const merchantDomain = process.env.WAYFORPAY_MERCHANT_DOMAIN;
    const orderDate = Math.floor(new Date(order.createdAt).getTime() / 1000);
    const amount = parseFloat(order.total).toFixed(2);
    const productPrice = amount;

    const params = [
      merchantLogin,
      merchantDomain,
      order.orderNumber,
      orderDate.toString(),
      amount,
      'UAH',
      `Замовлення ${order.orderNumber}`,
      '1',
      productPrice,
    ];

    const signature = generateSignature(params, merchantSecret);

    const formData = {
      merchantAccount: merchantLogin,
      merchantDomainName: merchantDomain,
      merchantSignature: signature,
      orderReference: order.orderNumber,
      orderDate: orderDate,
      amount: amount,
      currency: 'UAH',
      productName: [`Замовлення ${order.orderNumber}`],
      productCount: ['1'],
      productPrice: [productPrice],
      returnUrl: `${process.env.CLIENT_URL || merchantDomain}/order-success/${order.id}`,
      serviceUrl: `${merchantDomain}/api/payments/callback`,
    };

    res.json(formData);
  } catch (err) {
    res.status(500).json({ error: 'Помилка створення платежу' });
  }
});

router.post('/callback', async (req, res) => {
  try {
    const { merchantSignature, orderReference, transactionStatus, reasonCode, amount, currency, cardPan, transactionId } = req.body;

    const order = await Order.findOne({ where: { orderNumber: orderReference } });
    if (!order) {
      return res.json({ orderReference, status: 'accept', time: Date.now() });
    }

    // Verify WayForPay signature
    const signParams = [
      orderReference,
      transactionStatus,
      reasonCode || '',
      amount ? amount.toString() : order.total.toString(),
      currency || 'UAH',
      cardPan || '',
      transactionId || '',
    ];
    const expectedSignature = generateSignature(signParams, process.env.WAYFORPAY_MERCHANT_SECRET);

    if (merchantSignature && merchantSignature !== expectedSignature) {
      console.warn('WayForPay callback: invalid signature for order', orderReference);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    if (transactionStatus === 'Approved') {
      order.paymentStatus = 'paid';
      order.status = 'processing';
    } else if (transactionStatus === 'Declined' || transactionStatus === 'Expired') {
      order.paymentStatus = 'failed';
    } else if (transactionStatus === 'Refunded') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

    const time = Math.floor(Date.now() / 1000);
    const responseParams = [order.orderNumber, 'accept', time.toString()];
    const signature = generateSignature(responseParams, process.env.WAYFORPAY_MERCHANT_SECRET);

    res.json({
      orderReference: order.orderNumber,
      status: 'accept',
      time,
      signature,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
