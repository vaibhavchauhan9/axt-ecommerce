import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Retrieve authenticated user's cart state
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock sku slug',
  });

  // Structural Initialization: If no persistent record exists, create a clean empty structure
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Add or increment items in the user's shopping session
// @route   POST /api/v1/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity, size, colorName, colorHex } = req.body;
  const targetQty = parseInt(quantity, 10) || 1;

  // 1. Verify existence and inventory space of target catalog item
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('The requested catalog product could not be found.', 404));
  }

  if (product.stock < targetQty) {
    return next(new AppError(`Insufficient stock allocation. Only ${product.stock} items remaining.`, 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // 2. Identify if item matching this exact variant structure is already in the cart
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color.name === colorName
  );

  if (existingItemIndex > -1) {
    const totalProposedQty = cart.items[existingItemIndex].quantity + targetQty;
    if (product.stock < totalProposedQty) {
      return next(new AppError(`Cannot increment quantity. Total cart items exceed remaining inventory stock.`, 400));
    }
    cart.items[existingItemIndex].quantity = totalProposedQty;
  } else {
    cart.items.push({
      product: productId,
      quantity: targetQty,
      size,
      color: { name: colorName, hex: colorHex },
    });
  }

  await cart.save();
  
  // Re-populate to pass comprehensive, premium UI details back to client state
  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock sku slug',
  });

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Update the quantity of an existing item variation in the active cart
// @route   PATCH /api/v1/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const targetQty = parseInt(quantity, 10);

  if (!targetQty || targetQty < 1) {
    return next(new AppError('Quantity must be at least 1. Use the delete endpoint to remove an item.', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('No active cart record located for this user.', 404));
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return next(new AppError('Target cart item not found.', 404));
  }

  const product = await Product.findById(item.product);
  if (!product) {
    return next(new AppError('The underlying catalog product could not be found.', 404));
  }
  if (product.stock < targetQty) {
    return next(new AppError(`Insufficient stock allocation. Only ${product.stock} items remaining.`, 400));
  }

  item.quantity = targetQty;
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock sku slug',
  });

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Remove an item variation completely from the active cart mapping matrix
// @route   DELETE /api/v1/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('No active cart record located for this user.', 404));
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name price discountPrice images stock sku slug',
  });

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});