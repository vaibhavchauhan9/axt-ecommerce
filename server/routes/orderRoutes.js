import express from 'express';
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, downloadInvoice } from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure order tracking pipelines behind user authentication

router.route('/')
  .post(createOrder);

router.route('/my-orders')
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/invoice')
  .get(downloadInvoice);

router.route('/:id/status')
  .patch(restrictTo('admin'), updateOrderStatus);

export default router;
