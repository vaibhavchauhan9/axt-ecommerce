import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

const CART_POPULATE = {
  path: 'items.product',
  select: 'name price discountPrice images stock sku slug',
};

// Recomputes the subtotal for only the *active* (not saved-for-later) items
const getActiveSubtotal = (cart) =>
  cart.items
    .filter((item) => !item.savedForLater)
    .reduce((total, item) => {
      const price = item.product?.discountPrice || item.product?.price || 0;
      return total + price * item.quantity;
    }, 0);

// If a coupon is applied but the cart no longer meets its minimum, drop it silently
const reconcileCoupon = (cart, subtotal) => {
  if (cart.coupon?.code && subtotal <= 0) {
    cart.coupon = { code: null, discountType: null, discountValue: null, discountAmount: 0 };
  }
};

// @desc    Retrieve authenticated user's cart state
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);

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

  // 2. Identify if item matching this exact variant structure is already in the ACTIVE cart
  //    (saved-for-later copies are intentionally excluded so re-adding creates a fresh active line)
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      !item.savedForLater &&
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
      savedForLater: false,
    });
  }

  await cart.save();
  await cart.populate(CART_POPULATE);

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
  await cart.populate(CART_POPULATE);

  const subtotal = getActiveSubtotal(cart);
  reconcileCoupon(cart, subtotal);
  await cart.save();

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
  await cart.populate(CART_POPULATE);

  const subtotal = getActiveSubtotal(cart);
  reconcileCoupon(cart, subtotal);
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Move an active cart item into "Save for Later"
// @route   PATCH /api/v1/cart/:itemId/save-for-later
// @access  Private
export const saveItemForLater = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('No active cart record located for this user.', 404));
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return next(new AppError('Target cart item not found.', 404));
  }

  item.savedForLater = true;
  await cart.save();
  await cart.populate(CART_POPULATE);

  const subtotal = getActiveSubtotal(cart);
  reconcileCoupon(cart, subtotal);
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Move a "Saved for Later" item back into the active cart
// @route   PATCH /api/v1/cart/:itemId/move-to-cart
// @access  Private
export const moveItemToCart = asyncHandler(async (req, res, next) => {
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
  if (product.stock < item.quantity) {
    return next(new AppError(`Insufficient stock allocation. Only ${product.stock} items remaining.`, 400));
  }

  item.savedForLater = false;
  await cart.save();
  await cart.populate(CART_POPULATE);

  res.status(200).json({
    status: 'success',
    data: { cart },
  });
});

// @desc    Apply a coupon code to the active cart items
// @route   POST /api/v1/cart/apply-coupon
// @access  Private
export const applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return next(new AppError('A coupon code is required.', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);
  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
    return next(new AppError('Your cart is empty. Add items before applying a coupon.', 400));
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) {
    return next(new AppError('Invalid coupon code.', 404));
  }

  const subtotal = getActiveSubtotal(cart);
  const result = coupon.validateForCart(subtotal);

  if (!result.valid) {
    return next(new AppError(result.message, 400));
  }

  cart.coupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: result.discountAmount,
  };
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully.',
    data: { cart },
  });
});

// @desc    Remove the currently applied coupon from the cart
// @route   DELETE /api/v1/cart/coupon
// @access  Private
export const removeCoupon = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(CART_POPULATE);
  if (!cart) {
    return next(new AppError('No active cart record located for this user.', 404));
  }

  cart.coupon = { code: null, discountType: null, discountValue: null, discountAmount: 0 };
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Coupon removed.',
    data: { cart },
  });
});
