import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure cart operations behind user authentication

router.route('/')
  .get(getCart)
  .post(addToCart);

router.route('/:itemId')
  .patch(updateCartItem)
  .delete(removeFromCart);

export default router;