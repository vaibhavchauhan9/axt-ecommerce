import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Receive a Support/Contact Us form submission and forward it to the
//          store owner's inbox via the existing Brevo-backed email pipeline.
// @route   POST /api/v1/contact
// @access  Public
export const submitContactForm = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return next(new AppError('Name, email, and message are required.', 400));
  }

  const destination = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;
  if (!destination) {
    return next(new AppError('Support inbox is not configured yet. Please try again later.', 500));
  }

  const html = `
    <h3>New Support Request — AXT</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  try {
    await sendEmail({
      to: destination,
      subject: `[AXT Support] ${subject || 'General Inquiry'} — from ${name}`,
      html,
    });
  } catch (emailErr) {
    console.error('[Contact Form Dispatch Error]:', emailErr.message);
    return next(new AppError('Unable to send your message right now. Please try again shortly.', 500));
  }

  res.status(200).json({
    status: 'success',
    message: "Your message has been sent — we'll get back to you soon.",
  });
});

