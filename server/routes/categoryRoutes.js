import express from 'express';
import { createCategory, deleteCategory, getCategories, getCollections, updateCategory } from '../controllers/categoryController.js';
import { admin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, admin, createCategory);
router.get('/collections', getCollections);
router.route('/:id').put(protect, admin, updateCategory).delete(protect, admin, deleteCategory);

export default router;