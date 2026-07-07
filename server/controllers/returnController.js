import Order from '../models/Order.js';
import Return, { RETURN_STATUS_SEQUENCE } from '../models/Return.js';
import Refund from '../models/Refund.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import { createNotification } from './notificationController.js';
import { refundOriginalPayment } from '../services/refundGateway.js';

// How many days after delivery a customer may still open a return/replacement/refund request.
const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS) || 7;

const orderItemKey = (item) => `${item.product.toString()}_${item.size}_${item.color?.name}`;

// @desc    Customer opens a return, replacement, or refund request against a delivered order
// @route   POST /api/v1/returns
// @access  Private
// Body: { orderId, requestType, reason, description?, images?, items: [{ productId, size, color, quantity }] }
export const createReturnRequest = asyncHandler(async (req, res, next) => {
  const { orderId, requestType, reason, description, images, items } = req.body;

  if (!['RETURN', 'REPLACEMENT', 'REFUND'].includes(requestType)) {
    return next(new AppError('requestType must be RETURN, REPLACEMENT, or REFUND.', 400));
  }
  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('At least one item must be selected for this request.', 400));
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    return next(new AppError('Order not found on your account.', 404));
  }
  if (order.orderStatus !== 'DELIVERED') {
    return next(new AppError('Returns can only be requested once an order has been delivered.', 400));
  }
  if (order.deliveredAt) {
    const daysSinceDelivery = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      return next(
        new AppError(`The return window (${RETURN_WINDOW_DAYS} days after delivery) for this order has closed.`, 400)
      );
    }
  }

  // Tally quantities already covered by non-rejected/cancelled return requests on this order,
  // so a customer can't request a return on more units than they actually bought.
  const priorReturns = await Return.find({
    order: order._id,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });
  const alreadyRequestedQty = {};
  priorReturns.forEach((r) =>
    r.items.forEach((it) => {
      const key = orderItemKey(it);
      alreadyRequestedQty[key] = (alreadyRequestedQty[key] || 0) + it.quantity;
    })
  );

  const resolvedItems = [];
  for (const requested of items) {
    const orderItem = order.items.find(
      (oi) =>
        oi.product.toString() === requested.productId &&
        oi.size === requested.size &&
        oi.color?.name === requested.color?.name
    );
    if (!orderItem) {
      return next(new AppError('One of the selected items does not belong to this order.', 400));
    }
    const key = orderItemKey(orderItem);
    const remaining = orderItem.quantity - (alreadyRequestedQty[key] || 0);
    if (requested.quantity < 1 || requested.quantity > remaining) {
      return next(
        new AppError(
          `Only ${Math.max(remaining, 0)} unit(s) of "${orderItem.name}" (${orderItem.size}/${orderItem.color?.name}) remain eligible for return.`,
          400
        )
      );
    }
    resolvedItems.push({
      product: orderItem.product,
      name: orderItem.name,
      image: orderItem.image,
      size: orderItem.size,
      color: orderItem.color,
      price: orderItem.price,
      quantity: requested.quantity,
    });
  }

  const returnRequest = await Return.create({
    order: order._id,
    user: req.user._id,
    requestType,
    reason,
    description,
    images: Array.isArray(images) ? images.slice(0, 6) : [],
    items: resolvedItems,
  });

  await createNotification({
    user: req.user._id,
    title: 'Return Request Submitted',
    message: `Your ${requestType.toLowerCase()} request for order #${order._id.toString().slice(-8).toUpperCase()} has been received and is under review.`,
    type: 'RETURN',
    link: '/profile',
  });

  res.status(201).json({ status: 'success', data: { returnRequest } });
});

// @desc    List the authenticated customer's own return/replacement/refund requests
// @route   GET /api/v1/returns/my
// @access  Private
export const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ status: 'success', results: returns.length, data: { returns } });
});

// @desc    Get a single return request (owner or admin)
// @route   GET /api/v1/returns/:id
// @access  Private
export const getReturnById = asyncHandler(async (req, res, next) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate('user', 'name email phoneNumber')
    .populate('refund');

  if (!returnRequest) {
    return next(new AppError('Return request not found.', 404));
  }
  if (req.user.role !== 'admin' && returnRequest.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this return request.', 403));
  }

  res.status(200).json({ status: 'success', data: { returnRequest } });
});

// @desc    Customer withdraws their own request while it's still awaiting review
// @route   PATCH /api/v1/returns/:id/cancel
// @access  Private
export const cancelReturnRequest = asyncHandler(async (req, res, next) => {
  const returnRequest = await Return.findOne({ _id: req.params.id, user: req.user._id });
  if (!returnRequest) {
    return next(new AppError('Return request not found on your account.', 404));
  }
  if (returnRequest.status !== 'REQUESTED') {
    return next(new AppError('This request is already being processed and can no longer be cancelled.', 400));
  }
  returnRequest.status = 'CANCELLED';
  await returnRequest.save();
  res.status(200).json({ status: 'success', data: { returnRequest } });
});

// -------------------- ADMIN --------------------

// @desc    List/filter all return, replacement, and refund requests
// @route   GET /api/v1/returns?status=&requestType=
// @access  Private/Admin
export const getAllReturns = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.requestType) filter.requestType = req.query.requestType;

  const returns = await Return.find(filter)
    .populate('user', 'name email phoneNumber')
    .populate('order', 'totalPrice orderStatus')
    .populate('refund')
    .sort('-createdAt');

  res.status(200).json({ status: 'success', results: returns.length, data: { returns } });
});

// @desc    Approve, reject, schedule pickup, or mark product received on a request
// @route   PATCH /api/v1/returns/:id/status
// @access  Private/Admin
// Body: { status, note?, rejectionReason?, pickupDate?, pickupAddress?, inspectionCondition?, restock? }
export const updateReturnStatus = asyncHandler(async (req, res, next) => {
  const {
    status,
    note,
    rejectionReason,
    pickupDate,
    pickupAddress,
    inspectionCondition,
    restock = true,
  } = req.body;

  const VALID_STATUSES = [...RETURN_STATUS_SEQUENCE, 'REJECTED'];
  if (!VALID_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status "${status}".`, 400));
  }

  const returnRequest = await Return.findById(req.params.id).populate('user', 'name email');
  if (!returnRequest) {
    return next(new AppError('Return request not found.', 404));
  }
  if (['REJECTED', 'CANCELLED', 'REFUND_PROCESSED'].includes(returnRequest.status)) {
    return next(new AppError(`This request is already ${returnRequest.status} and cannot be updated further.`, 400));
  }

  const currentIndex = RETURN_STATUS_SEQUENCE.indexOf(returnRequest.status);
  const nextIndex = RETURN_STATUS_SEQUENCE.indexOf(status);
  if (status !== 'REJECTED' && nextIndex < currentIndex) {
    return next(new AppError(`Cannot move status backward from ${returnRequest.status} to ${status}.`, 400));
  }
  if (status === 'REJECTED' && !rejectionReason) {
    return next(new AppError('A rejectionReason is required when rejecting a request.', 400));
  }

  returnRequest.status = status;
  if (note) returnRequest.$locals.pendingNote = note;
  if (status === 'REJECTED') returnRequest.rejectionReason = rejectionReason;
  if (status === 'PICKUP_SCHEDULED') {
    returnRequest.pickup.scheduledDate = pickupDate ? new Date(pickupDate) : null;
    returnRequest.pickup.address = pickupAddress || null;
  }
  if (status === 'PRODUCT_RECEIVED') {
    returnRequest.inspection.receivedAt = new Date();
    returnRequest.inspection.condition = inspectionCondition || null;
    returnRequest.inspection.approvedForRefund = true;

    // Put the physically-returned inventory back on the shelf. Skipped only
    // if the admin explicitly unchecks `restock` (e.g. item arrived damaged
    // and is being written off instead of resold).
    if (restock) {
      for (const item of returnRequest.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
  }

  await returnRequest.save();

  const statusMessages = {
    APPROVED: 'has been approved.',
    REJECTED: `was rejected: ${rejectionReason}`,
    PICKUP_SCHEDULED: 'has a pickup scheduled.',
    PRODUCT_RECEIVED: 'item(s) have been received and are being inspected.',
    REFUND_PROCESSED: 'refund has been processed.',
  };
  if (statusMessages[status]) {
    await createNotification({
      user: returnRequest.user._id,
      title: `${returnRequest.requestType.charAt(0) + returnRequest.requestType.slice(1).toLowerCase()} Update`,
      message: `Your ${returnRequest.requestType.toLowerCase()} request ${statusMessages[status]}`,
      type: 'RETURN',
      link: '/profile',
    });
  }

  res.status(200).json({ status: 'success', data: { returnRequest } });
});

// @desc    Process the actual refund payout for an approved, received return request
// @route   POST /api/v1/returns/:id/refund
// @access  Private/Admin
// Body: { amount?, method? } — amount defaults to the sum of the returned items' price*quantity
export const processRefund = asyncHandler(async (req, res, next) => {
  const returnRequest = await Return.findById(req.params.id).populate('user', 'name email');
  if (!returnRequest) {
    return next(new AppError('Return request not found.', 404));
  }
  if (returnRequest.requestType === 'REPLACEMENT') {
    return next(new AppError('Replacement requests do not issue a refund. Use the status endpoint instead.', 400));
  }
  if (returnRequest.status !== 'PRODUCT_RECEIVED') {
    return next(
      new AppError('A refund can only be processed after the returned product has been received (or for a no-return REFUND request already approved).', 400)
    );
  }
  if (returnRequest.refund) {
    return next(new AppError('A refund has already been initiated for this request.', 400));
  }

  const order = await Order.findById(returnRequest.order);
  if (!order) {
    return next(new AppError('The associated order could not be found.', 404));
  }

  const defaultAmount = returnRequest.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const amount = req.body.amount != null ? Number(req.body.amount) : defaultAmount;
  const method = req.body.method || 'ORIGINAL_PAYMENT_METHOD';

  const refund = await Refund.create({
    returnRequest: returnRequest._id,
    order: order._id,
    user: returnRequest.user._id,
    amount,
    method,
    status: 'PROCESSING',
  });

  // Attempt to actually move the money if refunding to the original payment method.
  if (method === 'ORIGINAL_PAYMENT_METHOD' && order.paymentMethod !== 'COD') {
    try {
      const gatewayResult = await refundOriginalPayment(order, amount);
      refund.gateway = gatewayResult.gateway;
      refund.gatewayRefundId = gatewayResult.gatewayRefundId;
      refund.status = gatewayResult.simulated ? 'PROCESSING' : 'COMPLETED';
      refund.processedAt = gatewayResult.simulated ? null : new Date();
    } catch (err) {
      refund.status = 'FAILED';
      refund.failureReason = err.message;
    }
  } else {
    // Store credit / bank transfer / COD refunds are recorded but require a manual
    // finance-team payout — mark completed once the admin confirms it separately.
    refund.gateway = 'MANUAL';
    refund.status = 'PENDING';
  }
  refund.processedBy = req.user._id;
  await refund.save();

  returnRequest.status = 'REFUND_PROCESSED';
  returnRequest.refund = refund._id;
  await returnRequest.save();

  await createNotification({
    user: returnRequest.user._id,
    title: 'Refund Processed',
    message: `A refund of ₹${amount.toFixed(2)} for order #${order._id.toString().slice(-8).toUpperCase()} has been ${refund.status === 'COMPLETED' ? 'completed' : 'initiated'}.`,
    type: 'RETURN',
    link: '/profile',
  });

  res.status(200).json({ status: 'success', data: { returnRequest, refund } });
});
