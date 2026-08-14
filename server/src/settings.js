const { Setting } = require('./models');

const PAYMENT_KEYS = {
  recipient: 'payment_recipient',
  iban: 'payment_iban',
  edrpou: 'payment_edrpou',
};

const SOCIAL_KEYS = {
  instagram: 'social_instagram',
  telegram: 'social_telegram',
  facebook: 'social_facebook',
};

function paymentDefaults() {
  return {
    recipient: process.env.PAYMENT_RECIPIENT || 'ГО ФК ХІТ',
    iban: process.env.PAYMENT_IBAN || 'UA000000000000000000000000000',
    edrpou: process.env.PAYMENT_EDRPOU || '00000000',
  };
}

function socialDefaults() {
  return {
    instagram: 'https://www.instagram.com/fc.xit.kyiv',
    telegram: 'https://t.me/fchitkyivchannel',
    facebook: 'https://www.facebook.com/share/g/1HvKB9AP2R/',
  };
}

async function getByKeys(keys, defaults, { allowEmpty = false } = {}) {
  const rows = await Setting.findAll({
    where: { key: Object.values(keys) },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result = {};
  for (const [field, key] of Object.entries(keys)) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const value = map[key] || '';
      result[field] = allowEmpty ? value : (value || defaults[field]);
    } else {
      result[field] = defaults[field];
    }
  }
  return result;
}

async function getPaymentDetails() {
  return getByKeys(PAYMENT_KEYS, paymentDefaults());
}

async function getSocialLinks() {
  return getByKeys(SOCIAL_KEYS, socialDefaults(), { allowEmpty: true });
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

function normalizeUrl(value, max = 300) {
  const url = String(value || '').trim().slice(0, max);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

async function setSocialLinks({ instagram, telegram, facebook }) {
  const updates = {
    [SOCIAL_KEYS.instagram]: normalizeUrl(instagram),
    [SOCIAL_KEYS.telegram]: normalizeUrl(telegram),
    [SOCIAL_KEYS.facebook]: normalizeUrl(facebook),
  };

  for (const [key, value] of Object.entries(updates)) {
    await Setting.upsert({ key, value });
  }

  return getSocialLinks();
}

module.exports = {
  getPaymentDetails,
  setPaymentDetails,
  getSocialLinks,
  setSocialLinks,
};
