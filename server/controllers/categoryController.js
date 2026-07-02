import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Create a new product category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, image } = req.body;

  const existing = await Category.findOne({ name });
  if (existing) {
    return next(new AppError('Category with this label already exists.', 400));
  }

  const category = await Category.create({ name, description, image });

  res.status(201).json({
    status: 'success',
    data: { category },
  });
});

// @desc    Fetch all catalog categories
// @route   GET /api/v1/categories
// @access  Public
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: { categories },
  });
});