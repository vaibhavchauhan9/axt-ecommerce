import express from 'express';
import { register, login, refreshAccessToken, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validators/authValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', protect, logout);

export default router;