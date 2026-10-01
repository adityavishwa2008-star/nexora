import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getProductCategories,
  getProductFacets,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { admin, protect } from '../middleware/authMiddleware.js';
import { createReview, listReviews, reviewEligibility } from '../controllers/reviewController.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/facets', getProductFacets);
router.get('/categories', getProductCategories);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/reviews', listReviews);
router.get('/:id/review-eligibility', protect, reviewEligibility);
router.post('/:id/reviews', protect, createReview);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

export default router;