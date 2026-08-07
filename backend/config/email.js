/* ==========================================================================
   FLEVA — Nodemailer Transport
   ========================================================================== */
const nodemailer = require('nodemailer');

const createTransport = () => {
  // Return null if SMTP not configured — emails will be logged to console instead
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

let transporter = null;

/**
 * Send an email. Falls back to console logging if SMTP is not configured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    transporter = createTransport();
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'FLEVA <noreply@fleva.com>',
    to,
    subject,
    html,
    text,
  };

  if (!transporter) {
    // Fallback: log to console during development
    console.log('📧 Email (console fallback):');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text || html}`);
    return { accepted: [to], messageId: 'console-fallback' };
  }

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
