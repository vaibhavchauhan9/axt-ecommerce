import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

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