import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// Helper tool to safely strip out illegal parameter field injections (e.g., changing role to 'admin')
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Detects a card brand from its number prefix using standard IIN ranges.
// This is the ONLY thing the raw card number is used for — it is never stored.
const detectCardBrand = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay';
  return 'Other';
};

// @desc    Fetch authenticated user context profile details
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// @desc    Safely update current profile data parameters
// @route   PATCH /api/v1/users/update-me
// @access  Private
export const updateMe = asyncHandler(async (req, res, next) => {
  // 1. Prevent password modification data subversions on this endpoint loop
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This endpoint is not designed for password updates. Use update-my-password.', 400));
  }

  // 2. Filter input properties down to clean, non-sensitive properties
  const filteredBody = filterObj(req.body, 'name', 'phoneNumber');

  // 3. Execute updates with full query validation parsing rules
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// @desc    Append new shipping address records to the customer coordinates array
// @route   POST /api/v1/users/address
// @access  Private
export const addAddress = asyncHandler(async (req, res, next) => {
  const { street, city, state, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user._id);

  // If new entry is designated default address, unset previous defaults
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({ street, city, state, postalCode, country, isDefault });
  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: {
      addresses: user.addresses,
    },
  });
});

// @desc    Fetch every saved address for the authenticated user
// @route   GET /api/v1/users/address
// @access  Private
export const getAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    status: 'success',
    results: user.addresses.length,
    data: { addresses: user.addresses },
  });
});

// @desc    Update a single saved address by its subdocument id
// @route   PATCH /api/v1/users/address/:addressId
// @access  Private
export const updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  const address = user.addresses.id(addressId);

  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  if (street !== undefined) address.street = street;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (country !== undefined) address.country = country;

  // If this address is being promoted to default, unset the flag on all others
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: { addresses: user.addresses },
  });
});

// @desc    Remove a saved address by its subdocument id
// @route   DELETE /api/v1/users/address/:addressId
// @access  Private
export const deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user._id);
  const address = user.addresses.id(addressId);

  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  address.deleteOne();
  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: { addresses: user.addresses },
  });
});

// @desc    Fetch the authenticated user's saved wishlist products
// @route   GET /api/v1/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'name price discountPrice images stock sku slug brand',
  });

  res.status(200).json({
    status: 'success',
    results: user.wishlist.length,
    data: { wishlist: user.wishlist },
  });
});

// @desc    Add a product to the wishlist if absent, remove it if already present (toggle)
// @route   POST /api/v1/users/wishlist/:productId
// @access  Private
export const toggleWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  const alreadySaved = user.wishlist.some((id) => id.toString() === productId);

  if (alreadySaved) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }

  await user.save({ validateBeforeSave: false });
  await user.populate({
    path: 'wishlist',
    select: 'name price discountPrice images stock sku slug brand',
  });

  res.status(200).json({
    status: 'success',
    inWishlist: !alreadySaved,
    results: user.wishlist.length,
    data: { wishlist: user.wishlist },
  });
});

// ==========================================================
// Saved Cards
// (Only masked display data is ever stored — see detectCardBrand comment above)
// ==========================================================

// @desc    Fetch every saved payment card for the authenticated user
// @route   GET /api/v1/users/cards
// @access  Private
export const getSavedCards = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    status: 'success',
    results: user.savedCards.length,
    data: { cards: user.savedCards },
  });
});

// @desc    Save a new payment card (masked display data only — no raw PAN/CVV persisted)
// @route   POST /api/v1/users/cards
// @access  Private
export const addSavedCard = asyncHandler(async (req, res, next) => {
  const { cardHolderName, cardNumber, expiryMonth, expiryYear, isDefault } = req.body;

  if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear) {
    return next(new AppError('Cardholder name, card number, and expiry are required.', 400));
  }

  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) {
    return next(new AppError('Please provide a valid card number.', 400));
  }

  const now = new Date();
  const expiry = new Date(Number(expiryYear), Number(expiryMonth), 0); // last day of expiry month
  if (expiry < now) {
    return next(new AppError('This card has already expired.', 400));
  }

  const user = await User.findById(req.user._id);

  if (isDefault) {
    user.savedCards.forEach((card) => {
      card.isDefault = false;
    });
  }

  user.savedCards.push({
    cardHolderName,
    brand: detectCardBrand(digits),
    last4: digits.slice(-4),
    expiryMonth: Number(expiryMonth),
    expiryYear: Number(expiryYear),
    isDefault: isDefault || user.savedCards.length === 0, // first card saved becomes default automatically
  });

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    message: 'Card saved successfully.',
    data: { cards: user.savedCards },
  });
});

// @desc    Update a saved card's cardholder name, expiry, or default status
// @route   PATCH /api/v1/users/cards/:cardId
// @access  Private
export const updateSavedCard = asyncHandler(async (req, res, next) => {
  const { cardId } = req.params;
  const { cardHolderName, expiryMonth, expiryYear, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  const card = user.savedCards.id(cardId);

  if (!card) {
    return next(new AppError('Saved card not found.', 404));
  }

  if (cardHolderName !== undefined) card.cardHolderName = cardHolderName;
  if (expiryMonth !== undefined) card.expiryMonth = Number(expiryMonth);
  if (expiryYear !== undefined) card.expiryYear = Number(expiryYear);

  if (isDefault) {
    user.savedCards.forEach((c) => {
      c.isDefault = c._id.toString() === cardId;
    });
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: { cards: user.savedCards },
  });
});

// @desc    Remove a saved card
// @route   DELETE /api/v1/users/cards/:cardId
// @access  Private
export const deleteSavedCard = asyncHandler(async (req, res, next) => {
  const { cardId } = req.params;

  const user = await User.findById(req.user._id);
  const card = user.savedCards.id(cardId);

  if (!card) {
    return next(new AppError('Saved card not found.', 404));
  }

  const wasDefault = card.isDefault;
  card.deleteOne();

  // Promote another card to default if the deleted one held that role
  if (wasDefault && user.savedCards.length > 0) {
    user.savedCards[0].isDefault = true;
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: { cards: user.savedCards },
  });
});

// @desc    Alter security access credentials inside a running active session
// @route   PUT /api/v1/users/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Fetch user model context explicitly linking back hidden password fields
  const user = await User.findById(req.user._id).select('+password');

  // 2. Verify accuracy of existing structural password credentials
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('The current password provided is invalid.', 401));
  }

  // 3. Set the new password parameters (will trigger hash lifecycle hook automatically)
  user.password = newPassword;
  await user.save();

  // 4. Issue replacement tokens to maintain uninterrupted app flow
  const token = generateTokens(res, user._id);

  res.status(200).json({
    status: 'success',
    accessToken: token,
    message: 'Account password successfully updated.',
  });
});
