import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmail,
  resendVerificationOtp,
  googleLogin,
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
} from '../middleware/validators/authValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tighter throttle on the OTP-issuing endpoint specifically, to prevent
// mailbox spam / abuse of the email-sending route.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: 'fail',
    message: 'Too many OTP requests from this device. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slightly looser throttle on OTP/reset verification attempts (allows a few mistyped codes).
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: 'fail',
    message: 'Too many attempts from this device. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', protect, logout);

router.post('/forgot-password', otpRequestLimiter, validateForgotPassword, forgotPassword);
router.post('/verify-reset-otp', otpVerifyLimiter, validateVerifyOtp, verifyResetOtp);
router.post('/reset-password', otpVerifyLimiter, validateResetPassword, resetPassword);

router.post('/verify-email', otpVerifyLimiter, validateVerifyOtp, verifyEmail);
router.post('/resend-verification-otp', otpRequestLimiter, resendVerificationOtp);
router.post('/google', googleLogin);

export default router;