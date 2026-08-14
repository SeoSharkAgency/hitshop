const nodemailer = require('nodemailer');
const { getPaymentDetails } = require('./settings');

function getSmtpPort() {
  return parseInt(process.env.SMTP_PORT, 10) || 587;
}

function createSmtpTransport() {
  const port = getSmtpPort();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    requireTLS: !secure && port === 587,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildItemsHtml(items) {
  return items.map((item) => {
    const name = item.Product?.name || item.product?.name || 'Товар';
    const size = item.size ? ` (${item.size})` : '';
    const printNumber = item.printNumber || item.print_number || '';
    const printName = item.printName || item.print_name || '';
    const printParts = [];
    if (printNumber) printParts.push(`№${printNumber}`);
    if (printName) printParts.push(`«${String(printName)}»`);
    const printHtml = printParts.length
      ? `<div style="margin-top:4px;color:#1e3a5f;font-size:13px;"><strong>Набивка:</strong> ${printParts.join(' ')}</div>`
      : '';

    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">
        <div>${name}${size}</div>
        ${printHtml}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${(Number(item.price) * item.quantity).toLocaleString('uk-UA')} ₴</td>
    </tr>`;
  }).join('');
}

function buildOrderHtml(order, items, payment, orderUrl) {
  return `
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
          ${buildItemsHtml(items)}
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
        <p style="margin:4px 0;color:#333;"><strong>Одержувач:</strong> ${payment.recipient}</p>
        <p style="margin:4px 0;color:#333;"><strong>IBAN:</strong> ${payment.iban}</p>
        <p style="margin:4px 0;color:#333;"><strong>ЄДРПОУ:</strong> ${payment.edrpou}</p>
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
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@hitkyiv.store';
}

async function sendViaBrevo({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const fromEmail = getFromAddress();
  const fromName = process.env.SMTP_FROM_NAME || 'ФК Хіт Магазин';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
  return true;
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.SMTP_FROM
    || (process.env.SMTP_USER ? `ФК Хіт Магазин <${process.env.SMTP_USER}>` : 'ФК Хіт Магазин <onboarding@resend.dev>');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return true;
}

async function sendViaSmtp({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

  const transporter = createSmtpTransport();
  await transporter.sendMail({
    from: `"ФК Хіт Магазин" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}

async function sendOrderConfirmation(order, items) {
  if (!order.customerEmail) {
    console.warn('Email skipped: no customerEmail');
    return;
  }

  const hasTransport = !!(
    process.env.BREVO_API_KEY
    || process.env.RESEND_API_KEY
    || (process.env.SMTP_USER && process.env.SMTP_PASS)
  );
  if (!hasTransport) {
    console.warn('Email skipped: no BREVO_API_KEY / RESEND_API_KEY / SMTP credentials');
    return;
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const orderUrl = `${clientUrl}/order/${order.orderNumber}`;
  const payment = await getPaymentDetails();
  const html = buildOrderHtml(order, items, payment, orderUrl);
  const subject = `Замовлення ${order.orderNumber} — ФК Хіт`;
  const payload = { to: order.customerEmail, subject, html };

  try {
    let sent = false;
    let via = '';

    // HTTPS APIs first — SMTP ports often blocked on VPS
    if (process.env.BREVO_API_KEY) {
      sent = await sendViaBrevo(payload);
      via = 'brevo';
    } else if (process.env.RESEND_API_KEY) {
      sent = await sendViaResend(payload);
      via = 'resend';
    } else {
      sent = await sendViaSmtp(payload);
      via = `smtp:${process.env.SMTP_HOST || 'smtp.gmail.com'}:${getSmtpPort()}`;
    }

    if (sent) {
      console.log(`Email sent via ${via} to ${order.customerEmail} for order ${order.orderNumber}`, {
        items: items.map((i) => ({
          name: i.Product?.name,
          size: i.size,
          printNumber: i.printNumber || i.print_number || null,
          printName: i.printName || i.print_name || null,
        })),
      });
    }
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendOrderConfirmation };
