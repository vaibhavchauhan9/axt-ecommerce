import nodemailer from 'nodemailer';

// Gmail SMTP over the secure SSL port. Port 25 is blocked by virtually every
// cloud host (Render, Railway, Heroku, AWS, etc.) to prevent spam relay, which
// caused every outbound email attempt to hang until the connection timed out.
// Port 465 (SSL) is the correct port for authenticated Gmail SMTP submission
// and is not blocked by these providers.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  timeout: 10000, // Maximum 10 seconds wait check time
  connectionTimeout: 10000,
});

/**
 * Sends a real email via Gmail SMTP.
 * @param {Object} options
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
