import nodemailer from 'nodemailer';

// Render production compatible configuration targeting port 587 (TLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // port 587 ke liye false hona chahiye, isse TLS encryption use hota hai
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Render/Cloud networks par self-signed certificate errors ko bypass karne ke liye
    rejectUnauthorized: false
  }
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
