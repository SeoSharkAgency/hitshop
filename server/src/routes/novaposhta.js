const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

async function npRequest(model, method, properties = {}) {
  const response = await fetch(NP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.NOVAPOSHTA_API_KEY,
      modelName: model,
      calledMethod: method,
      methodProperties: properties,
    }),
  });
  return response.json();
}

router.get('/cities', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const result = await npRequest('Address', 'searchSettlements', {
      CityName: q,
      Limit: '15',
    });

    if (!result.success) return res.json([]);

    const cities = (result.data?.[0]?.Addresses || []).map((c) => ({
      ref: c.DeliveryCity,
      name: c.Present,
      area: c.Area,
    }));

    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Помилка пошуку міст' });
  }
});

router.get('/warehouses', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { cityRef, q } = req.query;
    if (!cityRef) return res.json([]);

    const properties = {
      CityRef: cityRef,
      Limit: '50',
      Page: '1',
    };
    if (q) properties.FindByString = q;

    const result = await npRequest('Address', 'getWarehouses', properties);

    if (!result.success) return res.json([]);

    const warehouses = (result.data || []).map((w) => ({
      ref: w.Ref,
      description: w.Description,
      shortAddress: w.ShortAddress,
      number: w.Number,
      typeOfWarehouse: w.TypeOfWarehouse,
    }));

    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: 'Помилка пошуку відділень' });
  }
});

router.post('/price', async (req, res) => {
  try {
    const { citySender, cityRecipient, weight, cost, seatsAmount } = req.body;

    const senderCity = citySender || process.env.NP_SENDER_CITY_REF;
    if (!senderCity || !cityRecipient) {
      return res.status(400).json({ error: 'Вкажіть місто відправника та отримувача' });
    }

    const result = await npRequest('InternetDocument', 'getDocumentPrice', {
      CitySender: senderCity,
      CityRecipient: cityRecipient,
      Weight: String(weight || '0.5'),
      ServiceType: 'WarehouseWarehouse',
      Cost: String(cost || '500'),
      CargoType: 'Parcel',
      SeatsAmount: String(seatsAmount || '1'),
    });

    if (!result.success || !result.data?.[0]) {
      return res.json({ cost: 0, estimatedDate: null });
    }

    res.json({
      cost: parseFloat(result.data[0].Cost),
      estimatedDate: result.data[0].EstimatedDeliveryDate || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка розрахунку вартості' });
  }
});

router.post('/create-ttn', auth, requireRole('admin', 'warehouse'), async (req, res) => {
  try {
    const {
      orderId,
      recipientCityRef,
      recipientWarehouseRef,
      recipientName,
      recipientPhone,
      weight,
      cost,
      description,
      seatsAmount,
    } = req.body;

    if (!recipientCityRef || !recipientWarehouseRef || !recipientName || !recipientPhone) {
      return res.status(400).json({ error: 'Заповніть всі поля отримувача' });
    }

    const nameParts = recipientName.trim().split(/\s+/);
    const lastName = nameParts[0] || 'Отримувач';
    const firstName = nameParts[1] || '';
    const middleName = nameParts.slice(2).join(' ') || '';

    const counterpartyResult = await npRequest('Counterparty', 'save', {
      FirstName: firstName || lastName,
      LastName: lastName,
      MiddleName: middleName,
      Phone: recipientPhone,
      Email: '',
      CounterpartyType: 'PrivatePerson',
      CounterpartyProperty: 'Recipient',
    });

    if (!counterpartyResult.success || !counterpartyResult.data?.[0]) {
      const errMsg = counterpartyResult.errors?.join(', ') || 'Помилка створення отримувача';
      return res.status(400).json({ error: errMsg });
    }

    const recipientRef = counterpartyResult.data[0].Ref;
    const contactRecipientRef = counterpartyResult.data[0].ContactPerson?.data?.[0]?.Ref || '';

    const result = await npRequest('InternetDocument', 'save', {
      PayerType: 'Recipient',
      PaymentMethod: 'Cash',
      DateTime: new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      CargoType: 'Parcel',
      Weight: String(weight || '0.5'),
      ServiceType: 'WarehouseWarehouse',
      SeatsAmount: String(seatsAmount || '1'),
      Description: description || 'Спортивна атрибутика ФК Хіт',
      Cost: String(cost || '500'),
      CitySender: process.env.NP_SENDER_CITY_REF,
      Sender: process.env.NP_SENDER_REF,
      SenderAddress: process.env.NP_SENDER_ADDRESS_REF,
      ContactSender: process.env.NP_SENDER_CONTACT_REF,
      SendersPhone: process.env.NP_SENDER_PHONE,
      CityRecipient: recipientCityRef,
      Recipient: recipientRef,
      RecipientAddress: recipientWarehouseRef,
      ContactRecipient: contactRecipientRef,
      RecipientsPhone: recipientPhone,
    });

    if (!result.success) {
      const errMsg = result.errors?.join(', ') || 'Помилка створення ТТН';
      return res.status(400).json({ error: errMsg });
    }

    const ttn = result.data?.[0];
    res.json({
      ttnNumber: ttn?.IntDocNumber || null,
      ttnRef: ttn?.Ref || null,
      estimatedDeliveryDate: ttn?.EstimatedDeliveryDate || null,
    });
  } catch (err) {
    console.error('NP create-ttn error:', err.message);
    res.status(500).json({ error: 'Помилка створення ТТН' });
  }
});

router.get('/tracking', auth, async (req, res) => {
  try {
    const { ttn } = req.query;
    if (!ttn) return res.status(400).json({ error: 'Вкажіть номер ТТН' });

    const result = await npRequest('TrackingDocument', 'getStatusDocuments', {
      Documents: [{ DocumentNumber: ttn, Phone: '' }],
    });

    if (!result.success || !result.data?.[0]) {
      return res.json({ status: 'Невідомо', statusCode: 0 });
    }

    const doc = result.data[0];
    res.json({
      status: doc.Status || 'Невідомо',
      statusCode: doc.StatusCode || 0,
      scheduledDeliveryDate: doc.ScheduledDeliveryDate || null,
      actualDeliveryDate: doc.ActualDeliveryDate || null,
      warehouseRecipient: doc.WarehouseRecipient || null,
      cityRecipient: doc.CityRecipient || null,
    });
  } catch {
    res.status(500).json({ error: 'Помилка відстеження' });
  }
});

module.exports = router;
