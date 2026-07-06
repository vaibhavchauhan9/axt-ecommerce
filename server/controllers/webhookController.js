import stripePkg from 'stripe';
import crypto from 'crypto';
import Order from '../models/Order.js';

const stripe = stripePkg(process.env.STRIPE_SECRET_KEY);

// Central processing loop that safely updates transaction records in our database
const completeOrderPayment = async (orderId, paymentId, email, gatewaySignature) => {
  const order = await Order.findById(orderId);
  if (order && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentId,
      status: 'COMPLETED',
      updateTime: new Date().toISOString(),
      emailAddress: email,
    };
    order.orderStatus = 'CONFIRMED'; // Payment captured — order is now confirmed for fulfilment
    await order.save();
    console.log(`[Webhook Success] Order ${orderId} successfully captured via ${gatewaySignature}.`);
  }
};

// @desc    Listen and decrypt structural events broadcast from Stripe systems
// @route   POST /api/v1/payments/webhooks/stripe
// @access  Public (Relies strictly on explicit cryptographic validation)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Validate signature authenticity using the raw byte buffer stream array
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[Webhook Security Alert] Cryptographic signature mismatch: ${err.message}`);
    return res.status(400).send(`Webhook signature confirmation failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    const paymentId = session.payment_intent;
    const email = session.customer_details.email;

    await completeOrderPayment(orderId, paymentId, email, 'STRIPE_WEBHOOK');
  }

  res.status(200).json({ received: true });
};

// @desc    Listen and decrypt verification events broadcast from Razorpay pipelines
// @route   POST /api/v1/payments/webhooks/razorpay
// @access  Public (Validated by strict SHA256 hashing computation checks)
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  // Compute string hash comparisons to verify data authenticity
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[Webhook Security Alert] Malformed Razorpay payload signature intercepted.');
    return res.status(400).json({ status: 'failure', message: 'Signature verification mismatch.' });
  }

  const payload = req.body;
  if (payload.event === 'order.paid') {
    const paymentDetails = payload.payload.payment.entity;
    const orderId = paymentDetails.notes.orderId;
    const paymentId = paymentDetails.id;
    const email = paymentDetails.email;

    await completeOrderPayment(orderId, paymentId, email, 'RAZORPAY_WEBHOOK');
  }

  res.status(200).json({ status: 'ok' });
};