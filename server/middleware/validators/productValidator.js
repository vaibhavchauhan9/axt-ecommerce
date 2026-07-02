import { body } from 'express-validator';
import { validateRequest } from '../validateMiddleware.js';

export const validateProductUpsert = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product tracking name required.')
    .isLength({ max: 120 }).withMessage('Product display name cannot exceed 120 characters.'),
  
  body('category')
    .notEmpty().withMessage('Product requires an established Category Object ID definition.')
    .isMongoId().withMessage('Invalid database object reference ID provided.'),
  
  body('price')
    .notEmpty().withMessage('Base product value pricing metrics required.')
    .isFloat({ min: 0 }).withMessage('Base catalog price cannot be lower than zero.'),
  
  body('sizes')
    .isArray({ min: 1 }).withMessage('A product listing requires at least one designated size selection.')
    .custom((sizesArray) => {
      const allowed = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const invalid = sizesArray.filter((s) => !allowed.includes(s));
      if (invalid.length > 0) {
        throw new Error(`Invalid sizing configurations: [${invalid.join(', ')}]`);
      }
      return true;
    }),
  
  body('sku')
    .trim()
    .notEmpty().withMessage('Stock Keeping Unit (SKU) parameter field required.'),
  
  body('stock')
    .isInt({ min: 0 }).withMessage('Inventory count tracking metrics cannot fall below zero.'),
    
  validateRequest
];
