import express from 'express';
import { registerUser, loginUser, getMe, updateProfile, updatePassword, getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.route('/addresses').get(protect, getAddresses).post(protect, addAddress);
router.route('/addresses/:addressId').put(protect, updateAddress).delete(protect, deleteAddress);

export default router;
