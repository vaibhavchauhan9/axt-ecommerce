import nodemailer from 'nodemailer';

// Render Security Bypass: Direct Baseline Node Connection Parameters
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 25, // 🟢 Render aur AWS jaise servers par Port 25 ko testing baseline ke liye standard pipeline di jaati hai
  secure: false, // Port 25 ke liye secure strictly false hoga
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  timeout: 10000, // Maximum 10 seconds wait check time
  connectionTimeout: 10000,
  tls: {
    // Security check logic ko force disable karne ke liye taaki cloud proxy network connection drop na kare
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
