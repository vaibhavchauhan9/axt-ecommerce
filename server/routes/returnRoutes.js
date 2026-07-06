import express from 'express';
import {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  cancelReturnRequest,
  getAllReturns,
  updateReturnStatus,
  processRefund,
} from '../controllers/returnController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Every return/replacement/refund action requires an authenticated session

// Customer-facing endpoints
router.post('/', createReturnRequest);
router.get('/my', getMyReturns);
router.patch('/:id/cancel', cancelReturnRequest);

// Admin-only endpoints — declared before the generic '/:id' owner-or-admin route
// so 'GET /returns' (list-all) doesn't collide with fetching a single request.
router.get('/', restrictTo('admin'), getAllReturns);
router.patch('/:id/status', restrictTo('admin'), updateReturnStatus);
router.post('/:id/refund', restrictTo('admin'), processRefund);

// Shared: owner or admin (access check happens inside the controller)
router.get('/:id', getReturnById);

export default router;

