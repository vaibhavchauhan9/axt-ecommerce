import express from 'express';
import { handleStripeWebhook, handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Webhook endpoints must receive the raw body buffer to parse cryptographic signatures correctly.
// We pass them to our routes without standard JSON body-parser parsing.
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/razorpay', express.json(), handleRazorpayWebhook);

export default router;