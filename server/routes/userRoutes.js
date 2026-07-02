import express from 'express';
import { getMe, updateMe, addAddress, updatePassword, getWishlist, toggleWishlist } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication lock rules globally across all user profile endpoints
router.use(protect);

router.get('/me', getMe);
router.patch('/update-me', updateMe);
router.post('/address', addAddress);
router.put('/update-password', updatePassword);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

export default router;