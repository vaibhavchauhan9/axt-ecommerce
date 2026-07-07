import express from 'express';
import {
  getMe,
  updateMe,
  deleteMe,
  uploadAvatar,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  updatePassword,
  getWishlist,
  toggleWishlist,
  getSavedCards,
  addSavedCard,
  updateSavedCard,
  deleteSavedCard,
} from '../controllers/userController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication lock rules globally across all user profile endpoints
router.use(protect);

router.get('/me', getMe);
router.patch('/update-me', updateMe);
router.post('/upload-avatar', upload.single('image'), uploadAvatar);
router.delete('/delete-me', deleteMe);
router.get('/address', getAddresses);
router.post('/address', addAddress);
router.patch('/address/:addressId', updateAddress);
router.delete('/address/:addressId', deleteAddress);
router.put('/update-password', updatePassword);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

// Saved Cards
router.get('/cards', getSavedCards);
router.post('/cards', addSavedCard);
router.patch('/cards/:cardId', updateSavedCard);
router.delete('/cards/:cardId', deleteSavedCard);

export default router;
