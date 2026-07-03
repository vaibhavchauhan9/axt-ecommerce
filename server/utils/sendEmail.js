import nodemailer from 'nodemailer';

// Reusable transporter targeting Gmail's SMTP service.
// Requires a Google Account "App Password" (NOT your normal Gmail password) —
// Google Account > Security > 2-Step Verification > App Passwords.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a real email via Gmail SMTP.
 * @param {Object} options
 * @param {string} options.to - Recipient's email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'AXT Attitude X T-Shirts'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
