import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Initialize Razorpay order structure log records
// @route   POST /api/v1/payments/razorpay/order
// @access  Private
export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // Setup options mapping configuration parameters (Razorpay expects sub-units like paise)
  const options = {
    amount: Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt: `rcpt_${order._id.toString().substring(0, 20)}`,
    notes: { orderId: order._id.toString() },
  };

  const razorpayOrder = await instance.orders.create(options);

  res.status(200).json({
    status: 'success',
    data: razorpayOrder,
  });
});