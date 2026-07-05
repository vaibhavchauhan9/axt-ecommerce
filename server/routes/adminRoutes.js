import express from 'express';
import {
  getDashboardStats,
  getSalesReport,
  getAllCustomers,
  getCustomerById,
  toggleBlockCustomer,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce administrative security barriers globally across this routing stack
router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/sales-report', getSalesReport);
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.patch('/customers/:id/block', toggleBlockCustomer);

// Coupon management
router.route('/coupons')
  .get(getAllCoupons)
  .post(createCoupon);

router.route('/coupons/:id')
  .patch(updateCoupon)
  .delete(deleteCoupon);

export default router;
