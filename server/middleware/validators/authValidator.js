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