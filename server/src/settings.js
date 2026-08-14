const { Setting } = require('./models');

const PAYMENT_KEYS = {
  recipient: 'payment_recipient',
  iban: 'payment_iban',
  edrpou: 'payment_edrpou',
};

function envDefaults() {
  return {
    recipient: process.env.PAYMENT_RECIPIENT || 'ГО ФК ХІТ',
    iban: process.env.PAYMENT_IBAN || 'UA000000000000000000000000000',
    edrpou: process.env.PAYMENT_EDRPOU || '00000000',
  };
}

async function getPaymentDetails() {
  const defaults = envDefaults();
  const rows = await Setting.findAll({
    where: { key: Object.values(PAYMENT_KEYS) },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    recipient: map[PAYMENT_KEYS.recipient] || defaults.recipient,
    iban: map[PAYMENT_KEYS.iban] || defaults.iban,
    edrpou: map[PAYMENT_KEYS.edrpou] || defaults.edrpou,
  };
}

async function setPaymentDetails({ recipient, iban, edrpou }) {
  const updates = {
    [PAYMENT_KEYS.recipient]: String(recipient || '').trim().slice(0, 200),
    [PAYMENT_KEYS.iban]: String(iban || '').replace(/\s+/g, '').toUpperCase().slice(0, 34),
    [PAYMENT_KEYS.edrpou]: String(edrpou || '').replace(/\D/g, '').slice(0, 10),
  };

  for (const [key, value] of Object.entries(updates)) {
    await Setting.upsert({ key, value });
  }

  return getPaymentDetails();
}

module.exports = { getPaymentDetails, setPaymentDetails };
