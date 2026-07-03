import { body } from 'express-validator';
import { validateRequest } from '../validateMiddleware.js';

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name parameter field is mandatory.')
    .isLength({ max: 50 }).withMessage('Name constraints cannot exceed 50 characters.'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email coordinate parameters required.')
    .isEmail().withMessage('Please submit a structurally valid email context.'),
  
  body('password')
    .notEmpty().withMessage('Password definition field required.')
    .isLength({ min: 8 }).withMessage('Password parameters must span at least 8 characters.'),
  
  validateRequest
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Please specify valid registration credentials.'),
  body('password')
    .notEmpty().withMessage('Target operational password criteria field empty.'),
  validateRequest
];

export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email coordinate parameters required.')
    .isEmail().withMessage('Please submit a structurally valid email context.'),
  validateRequest
];

export const validateVerifyOtp = [
  body('email')
    .trim()
    .isEmail().withMessage('Please submit a structurally valid email context.'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP field is mandatory.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
    .isNumeric().withMessage('OTP must contain digits only.'),
  validateRequest
];

export const validateResetPassword = [
  body('email')
    .trim()
    .isEmail().withMessage('Please submit a structurally valid email context.'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP field is mandatory.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
    .isNumeric().withMessage('OTP must contain digits only.'),
  body('newPassword')
    .notEmpty().withMessage('New password field is mandatory.')
    .isLength({ min: 8 }).withMessage('New password must span at least 8 characters.'),
  validateRequest
];