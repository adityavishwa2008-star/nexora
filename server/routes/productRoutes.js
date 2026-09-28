import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductCategories,
  getProductFacets,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { admin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/facets', getProductFacets);
router.get('/categories', getProductCategories);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

export default router;