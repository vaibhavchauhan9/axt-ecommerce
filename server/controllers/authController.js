import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import { generateTokens } from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import otpEmailTemplate from '../utils/otpEmailTemplate.js';
import jwt from 'jsonwebtoken';

// @desc    Register a new premium customer account footprint
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phoneNumber } = req.body;

  // 1. Verify user does not already exist within database registry
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 400));
  }

  // 2. Initialize the user profile document (Password is automatically hashed via Mongoose pre-save hook)
  const newUser = await User.create({
    name,
    email,
    password,
    phoneNumber,
  });

  // 3. Issue cryptographic tokens and establish HTTP-Only cookie parameters
  const accessToken = generateTokens(res, newUser._id);

  // 4. Return complete profile data payload (excluding hashed password signature)
  res.status(201).json({
    status: 'success',
    accessToken,
    data: {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phoneNumber: newUser.phoneNumber,
      },
    },
  });
});

// @desc    Authenticate customer credentials and issue active tokens
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Explicitly fetch the document alongside the protected password verification field
  const user = await User.findOne({ email }).select('+password +isActive');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email credentials or password verification match.', 401));
  }

  // 2. Verify account status before passing session tokens
  if (!user.isActive) {
    return next(new AppError('This user account footprint has been suspended.', 403));
  }

  // 3. Issue fresh tokens and set secure HTTP-only cookie tracking structures
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

// @desc    Rotate expired access tokens dynamically using the secure refresh cookie
// @route   POST /api/v1/auth/refresh-token
// @access  Public (Relies on verified HTTP-Only cookie presence)
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('Session expired. Missing valid refresh cookie credentials.', 401));
  }

  // 1. Verify token signature against the dedicated refresh secret string
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // 2. Verify user still exists in the database
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The session owner could not be located.', 401));
  }

  // 3. Re-issue fresh token parameters and rotate authorization context strings
  const newAccessToken = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

// @desc    Terminate session context state and clear dynamic tracking cookies
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, net) => {
  res.cookie('refreshToken', 'loggedout', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000), // Invalidate within ten seconds
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    status: 'success',
    message: 'Session tracking contexts successfully cleared.',
  });
});

// @desc    Generate a 6-digit OTP and email it to the account's registered address
// @route   POST /api/v1/auth/forgot-password
// @access  Public
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
    // 🟢 SAFE COMPATIBILITY LAYER: Agar template engine fail ho toh continuous text content jaye
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
    // Sending failed — roll back the OTP fields
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('[Email Dispatch Error]:', emailErr.message);
    return next(new AppError(`Unable to dispatch the reset OTP email right now. Details: ${emailErr.message}`, 500));
  }

  res.status(200).json(genericResponse);
});


// @desc    Verify a submitted OTP is correct and unexpired (does not consume it)
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
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

// @desc    Verify the OTP one final time and commit the new password
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetOTPExpires');

  if (!user || !user.verifyPasswordResetOTP(otp)) {
    return next(new AppError('This OTP is invalid or has expired. Please request a new one.', 400));
  }

  // Assign the new password — the pre-save hook hashes it and stamps passwordChangedAt,
  // which automatically invalidates any JWTs issued before this moment.
  user.password = newPassword;
  user.passwordResetOTP = undefined;
  user.passwordResetOTPExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. Please log in with your new password.',
  });
});
