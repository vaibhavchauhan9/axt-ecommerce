
import express from 'express';
import rateLimit from 'express-rate-limit';
import { submitContactForm } from '../controllers/contactController.js';

const router = express.Router();

// Prevent the public contact endpoint from being spammed/abused
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: 'fail',
    message: 'Too many messages sent. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactLimiter, submitContactForm);

export default router;
