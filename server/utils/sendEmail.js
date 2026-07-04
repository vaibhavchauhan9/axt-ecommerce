// Render's free tier blocks ALL outbound SMTP traffic (ports 25, 465, 587)
// as of Sept 2025 to prevent spam abuse — this is a platform-level firewall
// rule, not something fixable by changing ports or nodemailer config.
// Fix: send email over plain HTTPS (port 443, never blocked) using Brevo's
// transactional email REST API instead of raw SMTP.
//
// Setup (one-time):
// 1. Create a free account at https://www.brevo.com (300 emails/day free)
// 2. Go to Senders, Domains & Dedicated IPs -> Senders -> add & verify your
//    Gmail address as a "Single Sender" (a verification email is sent to it)
// 3. Go to SMTP & API -> API Keys -> generate a new API key
// 4. Add to Render environment variables:
//    BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//    EMAIL_USER=your_verified_gmail_address@gmail.com   (keep the existing var)
//    EMAIL_FROM_NAME=AXT Attitude X T-Shirts             (keep the existing var)

const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || 'AXT Attitude X T-Shirts',
        email: process.env.EMAIL_USER,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API responded with ${response.status}: ${errorBody}`);
  }

  return response.json();
};

export default sendEmail;
