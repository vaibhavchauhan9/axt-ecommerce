import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Construct a premium baseline order document out of active cart profiles
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;

  // 1. Retrieve current user session cart array
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart space is empty. Order generation cancelled.', 400));
  }

  // 2. Validate current inventory levels and re-calculate pricing metrics securely from DB values
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
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

  // 3. Compute auxiliary calculations (Tax, Shipping)
  const shippingPrice = itemsPrice > 100 ? 0 : 15; // Free shipping on high-value checkouts
  const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100; // 18% Standard Tax computation
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  // 4. Instantiate official Order state document
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // 5. Adjust stock levels across purchased products
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity },
    });
  }

  // 6. Purge the cart now that checkout processing has completed
  cart.items = [];
  await cart.save();

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

// @desc    Update logistics tracking status states across orders
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Target order record not located.', 404));
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'DELIVERED') {
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});