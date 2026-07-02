import express from 'express';
import { getDashboardStats, getSalesReport } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce administrative security barriers globally across this routing stack
router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/sales-report', getSalesReport);

export default router;