const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  getPaymentDetails,
  setPaymentDetails,
  getSocialLinks,
  setSocialLinks,
} = require('../settings');
const { logAction } = require('../auditLog');

const router = express.Router();

router.get('/payment', async (req, res) => {
  try {
    const payment = await getPaymentDetails();
    res.json(payment);
  } catch (err) {
    console.error('Get payment settings error:', err.message);
    res.status(500).json({ error: 'Помилка завантаження реквізитів' });
  }
});

router.put('/payment', auth, requireRole('admin', 'accountant'), async (req, res) => {
  try {
    const { recipient, iban, edrpou } = req.body;

    if (!recipient || String(recipient).trim().length < 2) {
      return res.status(400).json({ error: 'Вкажіть одержувача' });
    }

    const cleanIban = String(iban || '').replace(/\s+/g, '').toUpperCase();
    if (!/^UA\d{27}$/.test(cleanIban)) {
      return res.status(400).json({ error: 'IBAN має бути у форматі UA + 27 цифр' });
    }

    const cleanEdrpou = String(edrpou || '').replace(/\D/g, '');
    if (!/^\d{8}(\d{2})?$/.test(cleanEdrpou)) {
      return res.status(400).json({ error: 'ЄДРПОУ має містити 8 або 10 цифр' });
    }

    const payment = await setPaymentDetails({
      recipient,
      iban: cleanIban,
      edrpou: cleanEdrpou,
    });

    logAction(req, 'update', 'settings', null, `реквізити: ${payment.recipient}, ${payment.iban}`);
    res.json(payment);
  } catch (err) {
    console.error('Update payment settings error:', err.message);
    res.status(500).json({ error: 'Помилка збереження реквізитів' });
  }
});

router.get('/social', async (req, res) => {
  try {
    const social = await getSocialLinks();
    res.json(social);
  } catch (err) {
    console.error('Get social settings error:', err.message);
    res.status(500).json({ error: 'Помилка завантаження соцмереж' });
  }
});

router.put('/social', auth, requireRole('admin'), async (req, res) => {
  try {
    const { instagram, telegram, facebook } = req.body;
    const social = await setSocialLinks({ instagram, telegram, facebook });
    logAction(req, 'update', 'settings', null, 'соцмережі оновлено');
    res.json(social);
  } catch (err) {
    console.error('Update social settings error:', err.message);
    res.status(500).json({ error: 'Помилка збереження соцмереж' });
  }
});

module.exports = router;
