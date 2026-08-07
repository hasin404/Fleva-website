/* ==========================================================================
   FLEVA — Email Service
   Nodemailer transporter + email templates
   ========================================================================== */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Only create if SMTP credentials are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('⚠️  Email service not configured — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

// Generic send email
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    // Dev mode: just log to console
    console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`   Body: ${text.substring(0, 200)}...`);
    return { messageId: 'dev-' + Date.now() };
  }

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'FLEVA <noreply@fleva.com>',
    to,
    subject,
    html,
    text,
  });

  return info;
}

// ---- Pre-built email templates ----

exports.sendVerificationEmail = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: 'Verify your FLEVA account',
    html: `
      <div style="font-family:'Work Sans',sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin-bottom:8px;">FLEVA</h1>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background:#16140F;color:#F1EAD6;padding:20px;text-align:center;border-radius:12px;font-size:2rem;letter-spacing:0.15em;font-family:monospace;margin:20px 0;">
          ${otp}
        </div>
        <p style="font-size:0.85rem;color:#666;">This code expires in 10 minutes. If you didn't create an account, you can ignore this email.</p>
        <p>Crunch different.<br><strong>FLEVA</strong></p>
      </div>
    `,
    text: `Hi ${name}, your FLEVA verification code is: ${otp}. It expires in 10 minutes.`,
  });
};

exports.sendPasswordResetEmail = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: 'Reset your FLEVA password',
    html: `
      <div style="font-family:'Work Sans',sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin-bottom:8px;">FLEVA</h1>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Use this code:</p>
        <div style="background:#16140F;color:#F1EAD6;padding:20px;text-align:center;border-radius:12px;font-size:2rem;letter-spacing:0.15em;font-family:monospace;margin:20px 0;">
          ${otp}
        </div>
        <p style="font-size:0.85rem;color:#666;">This code expires in 10 minutes. If you didn't request a reset, you can ignore this email.</p>
      </div>
    `,
    text: `Hi ${name}, your FLEVA password reset code is: ${otp}. It expires in 10 minutes.`,
  });
};

exports.sendOrderConfirmationEmail = async (email, name, order) => {
  const itemsHtml = order.items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.title || 'Product'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">×${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">৳${i.price * i.qty}</td></tr>`
  ).join('');

  return sendEmail({
    to: email,
    subject: `FLEVA — Order Confirmed #${order.orderNumber}`,
    html: `
      <div style="font-family:'Work Sans',sans-serif;max-width:520px;margin:auto;padding:32px;">
        <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin-bottom:8px;">FLEVA</h1>
        <p>Hi ${name},</p>
        <p>Thanks for your order! Here's your summary:</p>
        <div style="background:#F8F3E6;border-radius:12px;padding:20px;margin:20px 0;">
          <p><strong>Order #${order.orderNumber}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin:12px 0;">
            ${itemsHtml}
          </table>
          <p style="text-align:right;font-weight:700;font-size:1.1rem;margin-top:12px;">Total: ৳${order.total}</p>
        </div>
        <p style="font-size:0.85rem;color:#666;">You can track your order anytime at fleva.com/account</p>
        <p>Crunch different.<br><strong>FLEVA</strong></p>
      </div>
    `,
    text: `Hi ${name}, your FLEVA order #${order.orderNumber} has been confirmed! Total: ৳${order.total}. Track it at fleva.com/account`,
  });
};

exports.sendOrderStatusEmail = async (email, name, orderNumber, status) => {
  const statusMessages = {
    confirmed: '✅ Your order has been confirmed and is being prepared.',
    packed: '📦 Your order has been packed and is ready for shipping.',
    shipped: '🚚 Your order has been shipped! It\'s on the way.',
    'out-for-delivery': '🏃 Your order is out for delivery today!',
    delivered: '🎉 Your order has been delivered. Enjoy!',
    cancelled: '❌ Your order has been cancelled.',
    refunded: '💰 Your refund has been processed.',
  };

  return sendEmail({
    to: email,
    subject: `FLEVA — Order #${orderNumber} ${status}`,
    html: `
      <div style="font-family:'Work Sans',sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin-bottom:8px;">FLEVA</h1>
        <p>Hi ${name},</p>
        <p>${statusMessages[status] || `Your order status has been updated to: ${status}`}</p>
        <p style="font-size:0.85rem;color:#666;margin-top:16px;">Order number: <strong>#${orderNumber}</strong></p>
        <p>Crunch different.<br><strong>FLEVA</strong></p>
      </div>
    `,
    text: `Hi ${name}, your FLEVA order #${orderNumber} status: ${status}. ${statusMessages[status] || ''}`,
  });
};

exports.sendEmail = sendEmail;
