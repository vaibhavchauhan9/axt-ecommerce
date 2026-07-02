import stripePkg from 'stripe';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// Instantiate Stripe client securely using server environment credentials
const stripe = stripePkg(process.env.STRIPE_SECRET_KEY);

// @desc    Initialize Stripe session wrapper mapping for UI checkout redirect
// @route   POST /api/v1/payments/stripe/checkout-session
// @access  Private
export const createStripeCheckoutSession = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  // 1. Fetch order state data matching incoming target criteria
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  // 2. Format localized order line items into clear Stripe parameter arrays
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: `${item.name} (${item.size} / ${item.color.name})`,
        images: [item.image],
      },
      unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
    },
    quantity: item.quantity,
  }));

  // Append auxiliary costs (Shipping and Tax parameters) if present
  if (order.shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shipping & Delivery handling fee' },
        unit_amount: Math.round(order.shippingPrice * 100),
      },
      quantity: 1,
    });
  }

  if (order.taxPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Estimated Government Sales Surcharge (GST/VAT)' },
        unit_amount: Math.round(order.taxPrice * 100),
      },
      quantity: 1,
    });
  }

  // 3. Initialize Stripe Session tracking matrix configurations
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/checkout/success?orderId=${order._id}`,
    cancel_url: `${process.env.CLIENT_URL}/checkout/cancel?orderId=${order._id}`,
    customer_email: order.user.email,
    client_reference_id: order._id.toString(),
    metadata: { orderId: order._id.toString() },
  });

  res.status(200).json({
    status: 'success',
    sessionUrl: session.url,
  });
});