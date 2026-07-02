import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Fetch advanced filtered product list with pagination engines
// @route   GET /api/v1/products
// @access  Public
export const getAllProducts = asyncHandler(async (req, res, next) => {
  // 1. Core Filtering Execution Setup
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Handle advanced mathematical operators ($gte, $lte, $lt, $gt)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gpg|gte|lt|lte)\b/g, (match) => `$${match}`);
  
  let finalQuery = Product.find(JSON.parse(queryStr));

  // 2. High-Performance Full-Text Weight Search Strategy
  if (req.query.search) {
    finalQuery = Product.find(
      { $text: { $search: req.query.search } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
  }

  // 3. Multi-Field Sorting Execution
  if (req.query.sort && !req.query.search) {
    const sortBy = req.query.sort.split(',').join(' ');
    finalQuery = finalQuery.sort(sortBy);
  } else if (!req.query.search) {
    finalQuery = finalQuery.sort('-createdAt'); // Default sorting timeline fallback
  }

  // 4. Pagination Core Layout Engines
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  finalQuery = finalQuery.skip(skip).limit(limit);

  // Execute populated query sequence
  const products = await finalQuery.populate('category', 'name slug');
  const totalCount = await Product.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    status: 'success',
    page,
    totalPages: Math.ceil(totalCount / limit),
    results: products.length,
    totalProducts: totalCount,
    data: { products },
  });
});

// @desc    Fetch singular asset details using slug path parameters
// @route   GET /api/v1/products/:slug
// @access  Public
export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  
  if (!product) {
    return next(new AppError('No product listed with those catalog credentials.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

// @desc    Insert a premium brand-new product into catalog architecture
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { product: newProduct },
  });
});

// @desc    Update an existing catalog entry completely
// @route   PATCH /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError('Target catalog item not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

// @desc    Remove an asset permanently from inventory layouts
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('Target catalog item not found.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});