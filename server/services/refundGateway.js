import stripePkg from 'stripe';
import Razorpay from 'razorpay';
import AppError from '../utils/appError.js';

const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/**
 * Refunds `amount` (in rupees) against the original payment captured on `order`.
 * Returns { gateway, gatewayRefundId, simulated }.
 */
export const refundOriginalPayment = async (order, amount) => {
  if (!order.paymentResult?.id) {
    throw new AppError('This order has no captured payment reference to refund against.', 400);
  }

  if (order.paymentMethod === 'STRIPE') {
    if (!stripeConfigured) {
      return { gateway: 'STRIPE', gatewayRefundId: `SIMULATED_${Date.now()}`, simulated: true };
    }
    const stripe = stripePkg(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentResult.id,
      amount: Math.round(amount * 100), // Stripe expects the smallest currency unit
    });
    return { gateway: 'STRIPE', gatewayRefundId: refund.id, simulated: false };
  }

  if (order.paymentMethod === 'RAZORPAY') {
    if (!razorpayConfigured) {
      return { gateway: 'RAZORPAY', gatewayRefundId: `SIMULATED_${Date.now()}`, simulated: true };
    }
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const refund = await instance.payments.refund(order.paymentResult.id, {
      amount: Math.round(amount * 100), // Razorpay expects paise
    });
    return { gateway: 'RAZORPAY', gatewayRefundId: refund.id, simulated: false };
  }

  throw new AppError(`Refunds via original payment method are not supported for "${order.paymentMethod}".`, 400);
};
