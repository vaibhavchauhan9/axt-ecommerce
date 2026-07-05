import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import { generateTokens } from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import otpEmailTemplate from '../utils/otpEmailTemplate.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate 6-digit numeric OTP
const generate6DigitOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 1. REGISTER (With Email Verification OTP)
// ==========================================
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phoneNumber } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 400));
  }

  // Generate OTP and set expiry (e.g., 10 minutes)
  const otp = generate6DigitOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Initialize user profile - isVerified explicit false, block login initially
  const newUser = await User.create({
    name,
    email,
    password,
    phoneNumber,
    isVerified: false,
    emailVerificationOTP: otp,
    emailVerificationOTPExpires: otpExpiry
  });

  // Send Verification Email via Brevo system
  try {
    let emailHtml = '';
    try {
      emailHtml = otpEmailTemplate(newUser.name, otp);
    } catch (tmplErr) {
      emailHtml = `<h3>AXT Attitude X T-Shirts</h3><p>Hello ${newUser.name},</p><p>Your email verification OTP is: <b>${otp}</b></p><p>Valid for 10 minutes.</p>`;
    }

    await sendEmail({
      to: newUser.email,
      subject: 'Verify Your AXT Account Email',
      html: emailHtml,
    });
  } catch (emailErr) {
    console.error('[Verification Email Error]:', emailErr.message);
    // Profile created but email failed, user can try "Resend OTP" on the /verify-email page
  }

  res.status(201).json({
    status: 'success',
    message: 'Registration successful! Please verify your email with the 6-digit OTP sent to you.',
    email: newUser.email
  });
});

// ==========================================
// 2. VERIFY EMAIL (OTP Submission)
// ==========================================
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User account not found.', 404));
  }

  if (user.isVerified) {
    return next(new AppError('Account is already verified. You can log in.', 400));
  }

  // Verify OTP matches and is not expired
  if (user.emailVerificationOTP !== otp || new Date() > user.emailVerificationOTPExpires) {
    return next(new AppError('Invalid or expired verification OTP. Please try again or resend.', 400));
  }

  // Update verification state and clear OTP fields
  user.isVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationOTPExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Instantly issue login tokens on successful verification
  const accessToken = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    message: 'Email successfully verified! You are now logged in.',
    accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
  });
});

// ==========================================
// 3. RESEND VERIFICATION OTP
// ==========================================
export const resendVerificationOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User account footprint not found.', 404));
  }

  if (user.isVerified) {
    return next(new AppError('This account has already been verified.', 400));
  }

  const otp = generate6DigitOTP();
  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    let emailHtml = `<h3>AXT Attitude X T-Shirts</h3><p>Hello ${user.name},</p><p>Your new verification OTP is: <b>${otp}</b></p><p>Valid for 10 minutes.</p>`;
    try {
      emailHtml = otpEmailTemplate(user.name, otp);
    } catch (tmplErr) {}

    await sendEmail({
      to: user.email,
      subject: 'Your New AXT Verification OTP',
      html: emailHtml,
    });
  } catch (emailErr) {
    return next(new AppError('Failed to dispatch verification email. Try again later.', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'A fresh 6-digit verification OTP has been sent to your email.'
  });
});

// ==========================================
// 4. LOGIN (Standard Credentials)
// ==========================================
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +isActive +isVerified');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email credentials or password verification match.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This user account footprint has been suspended.', 403));
  }

  // BLOCK LOGIN IF NOT VERIFIED
  if (!user.isVerified) {
    return next(new AppError('Your email address is not verified yet. Please verify first.', 403));
  }

  const accessToken = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// ==========================================
// 5. GOOGLE LOGIN HANDLER (Missing Link!)
// ==========================================
export const googleLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(new AppError('Google ID Token is required.', 400));
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    return next(new AppError('Google token verification failed.', 400));
  }

  const payload = ticket.getPayload();
  const { email, name, sub: googleId } = payload;

  // Match existing user or create a new one
  let user = await User.findOne({ email });

  if (!user) {
    // Automatically flag Google accounts as verified
    user = await User.create({
      name,
      email,
      isVerified: true, 
      password: Math.random().toString(36).slice(-12), // Dummy secure password
    });
  } else if (!user.isVerified) {
    // If user existed locally but wasn't verified, mark verified via trusted Google session
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  if (!user.isActive) {
    return next(new AppError('This user account has been suspended.', 403));
  }

  const accessToken = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// ==========================================
// 6. REFRESH ACCESS TOKEN
// ==========================================
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('Session expired. Missing valid refresh cookie credentials.', 401));
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The session owner could not be located.', 401));
  }

  const newAccessToken = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

// ==========================================
// 7. LOGOUT
// ==========================================
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('refreshToken', 'loggedout', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    status: 'success',
    message: 'Session tracking contexts successfully cleared.',
  });
});

// ==========================================
// 8. FORGOT PASSWORD (OTP)
// ==========================================
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const genericResponse = {
    status: 'success',
    message: 'If an account exists for this email, a 6-digit OTP has been sent to it.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const otp = user.createPasswordResetOTP();
  await user.save({ validateBeforeSave: false });

  try {
    let emailHtml = '';
    try {
      emailHtml = otpEmailTemplate(user.name, otp);
    } catch (tmplErr) {
      emailHtml = `<h3>AXT Attitude X T-Shirts</h3><p>Hello ${user.name},</p><p>Your secure OTP for password reset is: <b>${otp}</b></p><p>Valid for 10 minutes.</p>`;
    }

    await sendEmail({
      to: user.email,
      subject: 'Your AXT Password Reset OTP',
      html: emailHtml,
    });
  } catch (emailErr) {
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('[Email Dispatch Error]:', emailErr.message);
    return next(new AppError(`Unable to dispatch the reset OTP email right now. Details: ${emailErr.message}`, 500));
  }

  res.status(200).json(genericResponse);
});

// ==========================================
// 9. VERIFY RESET OTP
// ==========================================
export const verifyResetOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetOTPExpires');

  if (!user || !user.verifyPasswordResetOTP(otp)) {
    return next(new AppError('This OTP is invalid or has expired. Please request a new one.', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully.',
  });
});

// ==========================================
// 10. RESET PASSWORD
// ==========================================
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetOTPExpires');

  if (!user || !user.verifyPasswordResetOTP(otp)) {
    return next(new AppError('This OTP is invalid or has expired. Please request a new one.', 400));
  }

  user.password = newPassword;
  user.passwordResetOTP = undefined;
  user.passwordResetOTPExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. Please log in with your new password.',
  });
});