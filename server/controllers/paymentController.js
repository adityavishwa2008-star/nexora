import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';

const gateway = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

export const createPayment = async (req, res, next) => {
  try { const order = await Order.findById(req.body.orderId); if (!order || order.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Order not found' }); if (order.paymentMethod !== 'razorpay' || order.status !== 'pending') return res.status(400).json({ message: 'This order is not awaiting Razorpay payment' }); const razorpayOrder = await gateway().orders.create({ amount: Math.round(order.totalPrice * 100), currency: 'INR', receipt: order._id.toString() }); order.paymentResult = { razorpayOrderId: razorpayOrder.id }; await order.save(); res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency }); } catch (error) { next(error); }
};

export const verifyPayment = async (req, res, next) => {
  try { const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body; const order = await Order.findById(orderId); if (!order || order.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Order not found' }); const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex'); if (expected !== razorpaySignature || order.paymentResult?.razorpayOrderId !== razorpayOrderId) return res.status(400).json({ message: 'Payment verification failed' }); order.paymentResult = { razorpayOrderId, razorpayPaymentId }; order.isPaid = true; order.paidAt = new Date(); order.status = 'paid'; await order.save(); res.json(order); } catch (error) { next(error); }
};