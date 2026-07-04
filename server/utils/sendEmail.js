import nodemailer from 'nodemailer';

// Render Cloud networks ke liye Alternative Hyper-Compatible Transporter Setup
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.gmail.com', // 🟢 Gmail ka alternative relay host jo proxy/cloud networks par block nahi hota
  port: 587,
  secure: false, // TLS framework ke liye false hi rahega
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000, // 20 seconds timeout limit taaki Render load le sake
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false, // Network routing checks bypass karne ke liye
    minVersion: 'TLSv1.2'
  }
});

/**
 * Sends a real email via Gmail SMTP Relay.
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
