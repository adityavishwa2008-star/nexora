import express from 'express';
import { addWishlist, getWishlist, removeWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', addWishlist);
router.delete('/:productId', removeWishlist);
export default router;