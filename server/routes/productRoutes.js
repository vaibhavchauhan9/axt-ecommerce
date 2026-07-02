import express from 'express';
import { getAllProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { validateProductUpsert } from '../middleware/validators/productValidator.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllProducts)
  .post(protect, restrictTo('admin'), validateProductUpsert, createProduct);

router.route('/slug/:slug').get(getProductBySlug);

router.route('/:id')
  .patch(protect, restrictTo('admin'), updateProduct)
  .delete(protect, restrictTo('admin'), deleteProduct);

export default router;