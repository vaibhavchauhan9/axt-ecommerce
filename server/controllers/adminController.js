import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// @desc    Compile high-level dashboard analytic metrics
// @route   GET /api/v1/admin/dashboard-stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  // 1. Concurrent counts execution using optimized indexing loops
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();

  // 2. High-Performance Aggregation: Compute lifetime gross revenue
  const financialStats = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  const totalRevenue = financialStats.length > 0 ? financialStats[0].totalRevenue : 0;

  // 3. Low Stock Alert Pipeline (Threshold: < 5 pieces remaining)
  const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
    .select('name sku stock price')
    .limit(10);

  // 4. Monthly Sales Velocity Matrix (Last 6 Months Trend)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySalesTrend = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo },
        isPaid: true,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        monthlyRevenue: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      lowStockAlerts: lowStockProducts,
      salesTrend: monthlySalesTrend,
    },
  });
});

// @desc    Fetch comprehensive detailed sales ledger for export
// @route   GET /api/v1/admin/sales-report
// @access  Private/Admin
export const getSalesReport = asyncHandler(async (req, res, next) => {
  const reports = await Order.find({ isPaid: true })
    .populate('user', 'name email')
    .select('createdAt totalPrice paymentMethod itemsPrice orderStatus billingAddress')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reports.length,
    data: { reports },
  });
});

// @desc    List customers with search + pagination, annotated with order count and lifetime spend
// @route   GET /api/v1/admin/customers?search=&page=&limit=
// @access  Private/Admin
export const getAllCustomers = asyncHandler(async (req, res, next) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

  const matchStage = { role: 'customer' };
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    matchStage.$or = [{ name: regex }, { email: regex }, { phoneNumber: regex }];
  }

  const [customers, total] = await Promise.all([
    User.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
        },
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: { $filter: { input: '$orders', as: 'o', cond: { $eq: ['$$o.isPaid', true] } } },
                as: 'paidOrder',
                in: '$$paidOrder.totalPrice',
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phoneNumber: 1,
          isActive: 1,
          createdAt: 1,
          orderCount: 1,
          totalSpent: 1,
        },
      },
    ]),
    User.countDocuments(matchStage),
  ]);

  res.status(200).json({
    status: 'success',
    results: customers.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: { customers },
  });
});

// @desc    Fetch a single customer's profile plus their full order history and lifetime spend
// @route   GET /api/v1/admin/customers/:id
// @access  Private/Admin
export const getCustomerById = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('+isActive');

  if (!customer) {
    return next(new AppError('Customer not found.', 404));
  }

  const orders = await Order.find({ user: customer._id }).sort('-createdAt');
  const totalSpent = orders
    .filter((order) => order.isPaid)
    .reduce((sum, order) => sum + order.totalPrice, 0);

  res.status(200).json({
    status: 'success',
    data: {
      customer,
      orders,
      orderCount: orders.length,
      totalSpent,
    },
  });
});

// @desc    Toggle a customer's active status — blocks or unblocks their account access
// @route   PATCH /api/v1/admin/customers/:id/block
// @access  Private/Admin
export const toggleBlockCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('+isActive');

  if (!customer) {
    return next(new AppError('Customer not found.', 404));
  }

  customer.isActive = !customer.isActive;
  await customer.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: customer.isActive ? 'Customer unblocked.' : 'Customer blocked.',
    data: { customer },
  });
});