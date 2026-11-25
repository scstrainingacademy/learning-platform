import nodemailer from 'nodemailer';

const RESEND_API_URL = 'https://api.resend.com/emails';

function getFromAddress() {
  return process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'SCS Academy <no-reply@scstrainingacademy.com>';
}

async function sendWithResend({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend email failed (${response.status}): ${body.slice(0, 300)}`);
  }
}

async function sendWithSmtp({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY, or SMTP_USER and SMTP_PASSWORD.');
  }
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE !== 'false';
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: !smtpSecure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
    tls: { servername: smtpHost, minVersion: 'TLSv1.2' },
    family: 4,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

export async function sendEmail(message) {
  if (process.env.RESEND_API_KEY) {
    await sendWithResend(message);
    return;
  }
  await sendWithSmtp(message);
}
