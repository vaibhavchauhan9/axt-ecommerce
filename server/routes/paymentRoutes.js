import express from 'express';
import { createStripeCheckoutSession } from '../controllers/stripeController.js';
import { createRazorpayOrder } from '../controllers/razorpayController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/stripe/checkout-session', protect, createStripeCheckoutSession);
router.post('/razorpay/order', protect, createRazorpayOrder);

export default router;