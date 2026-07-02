import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Collect all layout translation exceptions into a single clean readable interface block
    const extractedErrors = errors.array().map((err) => `${err.path}: ${err.msg}`).join(', ');
    return next(new AppError(`Validation exception matrix: [${extractedErrors}]`, 400));
  }
  next();
};