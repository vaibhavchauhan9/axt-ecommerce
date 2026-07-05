import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  saveItemForLater,
  moveItemToCart,
  applyCoupon,
  removeCoupon,
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure cart operations behind user authentication

router.route('/')
  .get(getCart)
  .post(addToCart);

router.route('/apply-coupon')
  .post(applyCoupon);

router.route('/coupon')
  .delete(removeCoupon);

router.route('/:itemId')
  .patch(updateCartItem)
  .delete(removeFromCart);

// NEW: Save for Later
router.route('/:itemId/save-for-later')
  .patch(saveItemForLater);

router.route('/:itemId/move-to-cart')
  .patch(moveItemToCart);

export default router;
