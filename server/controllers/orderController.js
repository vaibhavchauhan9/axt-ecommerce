import Order, { ORDER_STATUS_SEQUENCE } from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import generateTrackingNumber from '../utils/generateTrackingNumber.js';
import { generateInvoicePdf } from '../utils/generateInvoicePdf.js';
import { createNotification } from './notificationController.js';

// @desc    Construct a premium baseline order document out of active cart profiles
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;

  // State & country are permanently fixed to the current delivery zone — never
  // trusted from the client, so a direct API call can't route an order elsewhere.
  const lockedShippingAddress = {
    ...shippingAddress,
    state: 'Uttar Pradesh',
    country: 'India',
  };

  // 1. Retrieve current user session cart array
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart space is empty. Order generation cancelled.', 400));
  }

  // Only items currently in the ACTIVE bag are checked out — "Saved for Later" items are left untouched
  const activeCartItems = cart.items.filter((item) => !item.savedForLater);
  if (activeCartItems.length === 0) {
    return next(new AppError('Your cart space is empty. Order generation cancelled.', 400));
  }

  // 2. Validate current inventory levels and re-calculate pricing metrics securely from DB values
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of activeCartItems) {
    const dbProduct = item.product;
    if (!dbProduct) {
      return next(new AppError('One or more products in your cart no longer exist.', 404));
    }

    if (dbProduct.stock < item.quantity) {
      return next(new AppError(`Stock variance detected for "${dbProduct.name}". Please adjust your cart.`, 400));
    }

    const clearPrice = dbProduct.discountPrice || dbProduct.price;
    itemsPrice += clearPrice * item.quantity;

    orderItems.push({
      product: dbProduct._id,
      name: dbProduct.name,
      image: dbProduct.images[0],
      price: clearPrice,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
  }

  // 3. Re-validate any coupon attached to the cart against fresh server-side numbers.
  //    The discount is NEVER trusted from the client/cart cache — it's recomputed here.
  let discountAmount = 0;
  let appliedCouponCode = null;

  if (cart.coupon?.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code });
    if (coupon) {
      const result = coupon.validateForCart(itemsPrice);
      if (result.valid) {
        discountAmount = result.discountAmount;
        appliedCouponCode = coupon.code;
      }
      // If it's no longer valid (expired, limit hit, etc.) it's silently dropped —
      // the order proceeds at full price rather than blocking checkout.
    }
  }

  // 4. Compute auxiliary calculations (Tax, Shipping) off the DISCOUNTED subtotal
  const discountedSubtotal = Math.max(itemsPrice - discountAmount, 0);
  const shippingPrice = discountedSubtotal > 100 ? 0 : 15; // Free shipping on high-value checkouts
  const taxPrice = Math.round(discountedSubtotal * 0.18 * 100) / 100; // 18% Standard Tax computation
  const totalPrice = discountedSubtotal + shippingPrice + taxPrice;

  // 5. Instantiate official Order state document
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: lockedShippingAddress,
    paymentMethod,
    itemsPrice,
    coupon: { code: appliedCouponCode, discountAmount },
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // 6. Adjust stock levels across purchased products
  for (const item of activeCartItems) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity },
    });
  }

  // 7. Increment the coupon's usage counter now that it's actually been spent
  if (appliedCouponCode) {
    await Coupon.findOneAndUpdate({ code: appliedCouponCode }, { $inc: { usedCount: 1 } });
  }

  // 8. Purge only the items that were just checked out — "Saved for Later" items and
  //    any coupon state are cleared for the next active bag.
  cart.items = cart.items.filter((item) => item.savedForLater);
  cart.coupon = { code: null, discountType: null, discountValue: null, discountAmount: 0 };
  await cart.save();

  // 9. Notify the customer that their order was placed successfully
  await createNotification({
    user: order.user,
    title: 'Order Placed',
    message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed successfully. Total: ₹${totalPrice.toFixed(2)}.`,
    type: 'ORDER',
    link: '/profile',
  });

  res.status(201).json({
    status: 'success',
    data: { order },
  });
});

// @desc    Retrieve personalized customer purchase historical timelines
// @route   GET /api/v1/orders/my-orders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders },
  });
});

// @desc    Fetch comprehensive singular order profile details
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  // Access Validation Guard: Ensure only the account owner or an administrator can view this document
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Access Denied. Unauthorized tracking request.', 403));
  }

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

// @desc    Generate and stream a professional PDF tax invoice for an order
// @route   GET /api/v1/orders/:id/invoice
// @access  Private (owner or admin)
export const downloadInvoice = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phoneNumber');

  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  // Same ownership guard as getOrderById — only the buyer or an admin can pull this document
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Access Denied. Unauthorized invoice request.', 403));
  }

  const fileName = `invoice-${order._id.toString().slice(-8).toUpperCase()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  generateInvoicePdf(order, res);
});

// @desc    Update logistics tracking status + courier/shipment details across orders
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin
// Body:    { orderStatus, note?, trackingNumber?, courierName?, courierPhone?,
//            courierTrackingUrl?, estimatedDeliveryDate? }
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const {
    orderStatus,
    note,
    trackingNumber,
    courierName,
    courierPhone,
    courierTrackingUrl,
    estimatedDeliveryDate,
  } = req.body;

  const VALID_STATUSES = [...ORDER_STATUS_SEQUENCE, 'CANCELLED'];
  if (!VALID_STATUSES.includes(orderStatus)) {
    return next(new AppError(`Invalid order status "${orderStatus}".`, 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  // Guard rails: don't allow silently jumping backward in the pipeline, and
  // don't allow any further change once an order is DELIVERED or CANCELLED.
  // CANCELLED itself is always reachable from any non-terminal state.
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus);
  const nextIndex = ORDER_STATUS_SEQUENCE.indexOf(orderStatus);

  if (['DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
    return next(new AppError(`Order is already ${order.orderStatus} and cannot be updated further.`, 400));
  }

  if (orderStatus !== 'CANCELLED' && nextIndex < currentIndex) {
    return next(
      new AppError(
        `Cannot move order status backward from ${order.orderStatus} to ${orderStatus}.`,
        400
      )
    );
  }

  order.orderStatus = orderStatus;

  // Attach an optional human note to the status-history entry that the
  // pre-save hook is about to create for this transition.
  if (note) {
    order.$locals.pendingNote = note;
  }

  // Courier / shipment metadata — only overwrite fields the admin actually sent,
  // so partial updates (e.g. just adding a courier phone later) don't wipe others.
  if (trackingNumber !== undefined) order.tracking.trackingNumber = trackingNumber;
  if (courierName !== undefined) order.tracking.courierName = courierName;
  if (courierPhone !== undefined) order.tracking.courierPhone = courierPhone;
  if (courierTrackingUrl !== undefined) order.tracking.courierTrackingUrl = courierTrackingUrl;
  if (estimatedDeliveryDate !== undefined) {
    order.tracking.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;
  }

  // Auto-generate a tracking number the moment an order first ships, if the
  // admin didn't supply one (e.g. no courier integration configured yet).
  if (['READY_TO_SHIP', 'SHIPPED'].includes(orderStatus) && !order.tracking.trackingNumber) {
    order.tracking.trackingNumber = generateTrackingNumber();
  }

  if (orderStatus === 'DELIVERED') {
    order.deliveredAt = Date.now();
  }

  await order.save();

  // Notify the customer that their order status has changed
  const statusMessages = {
    CONFIRMED: 'Your order has been confirmed and is being prepared.',
    PACKED: 'Your order has been packed and is being prepared for shipment.',
    READY_TO_SHIP: 'Your order is ready to ship.',
    SHIPPED: order.tracking.trackingNumber
      ? `Your order has shipped. Tracking number: ${order.tracking.trackingNumber}.`
      : 'Your order has shipped and is on its way to you.',
    OUT_FOR_DELIVERY: 'Your order is out for delivery and should arrive today.',
    DELIVERED: 'Your order has been delivered. Thank you for shopping with us!',
    CANCELLED: 'Your order has been cancelled.',
  };

  if (statusMessages[orderStatus]) {
    await createNotification({
      user: order.user,
      title: `Order ${orderStatus.replace(/_/g, ' ')}`,
      message: `Order #${order._id.toString().slice(-8).toUpperCase()}: ${statusMessages[orderStatus]}`,
      type: 'ORDER',
      link: '/profile',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});
