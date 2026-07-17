const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOrderConfirmation(order, items) {
  if (!process.env.SMTP_USER || !order.customerEmail) return;

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const orderUrl = `${clientUrl}/order/${order.orderNumber}`;

  const itemsHtml = items.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.Product?.name || 'Товар'} ${item.size ? `(${item.size})` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toLocaleString('uk-UA')} ₴</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#1e3a5f;margin:0;">ФК «ХІТ» Київ</h1>
        <p style="color:#666;margin:5px 0 0;">Інтернет-магазин</p>
      </div>

      <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="margin:0 0 10px;color:#333;">Замовлення ${order.orderNumber}</h2>
        <p style="color:#666;margin:0;">Дякуємо за замовлення! Нижче — деталі та реквізити для оплати.</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="padding:10px 12px;text-align:left;">Товар</th>
            <th style="padding:10px 12px;text-align:center;">Кіл-ть</th>
            <th style="padding:10px 12px;text-align:right;">Сума</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;font-weight:bold;">Разом:</td>
            <td style="padding:12px;text-align:right;font-weight:bold;color:#1e3a5f;font-size:18px;">${Number(order.total).toLocaleString('uk-UA')} ₴</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;color:#856404;">Реквізити для оплати</h3>
        <p style="margin:4px 0;color:#333;"><strong>Одержувач:</strong> ${process.env.PAYMENT_RECIPIENT || 'ФК ХІТ Київ'}</p>
        <p style="margin:4px 0;color:#333;"><strong>IBAN:</strong> ${process.env.PAYMENT_IBAN || 'UA000000000000000000000000000'}</p>
        <p style="margin:4px 0;color:#333;"><strong>ЄДРПОУ:</strong> ${process.env.PAYMENT_EDRPOU || '00000000'}</p>
        <p style="margin:4px 0;color:#333;"><strong>Призначення:</strong> Оплата за замовлення ${order.orderNumber}</p>
      </div>

      <div style="text-align:center;margin-bottom:20px;">
        <a href="${orderUrl}" style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;">
          Відстежити замовлення
        </a>
      </div>

      <p style="color:#999;font-size:12px;text-align:center;">
        Після оплати ваше замовлення буде оброблено протягом 1-2 робочих днів.<br>
        Статус замовлення можна перевірити за посиланням: <a href="${orderUrl}">${orderUrl}</a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ФК Хіт Магазин" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Замовлення ${order.orderNumber} — ФК Хіт`,
      html,
    });
    console.log(`Email sent to ${order.customerEmail} for order ${order.orderNumber}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendOrderConfirmation };
