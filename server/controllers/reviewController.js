import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Write a unique customer verification review
// @route   POST /api/v1/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res, next) => {
  const { review, rating, product } = req.body;

  // Automatically extract user identity boundary from protection verification hooks
  const userId = req.user._id;

  const existingReview = await Review.findOne({ product, user: userId });
  if (existingReview) {
    return next(new AppError('You have already submitted feedback evaluation for this collection item.', 400));
  }

  const newReview = await Review.create({
    review,
    rating,
    product,
    user: userId,
  });

  res.status(201).json({
    status: 'success',
    data: { review: newReview },
  });
});

// @desc    Fetch review listings linked to an isolated product tracking reference
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
export const getProductReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});