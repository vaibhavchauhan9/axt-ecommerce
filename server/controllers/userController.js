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