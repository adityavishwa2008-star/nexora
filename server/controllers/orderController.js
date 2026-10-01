import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const priceOf = (product) => Number(product.discountPrice ?? product.price);
const shippingFor = (itemsPrice) => (itemsPrice >= 999 ? 0 : 79);
const ownsOrder = (order, user) => order.user.toString() === user._id.toString() || user.role === 'admin';

export const createOrder = async (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;
  if (!['cod', 'razorpay'].includes(paymentMethod) || !shippingAddress?.name || !shippingAddress?.phone || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) return res.status(400).json({ message: 'Complete shipping address and payment method are required' });
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart?.items.length) return res.status(400).json({ message: 'Your cart is empty' });
  const changed = [];
  try {
    const items = cart.items.map(({ product, qty }) => ({ product, qty, price: priceOf(product), name: product.name, image: product.images?.[0] || '' }));
    for (const item of items) {
      const result = await Product.updateOne({ _id: item.product._id, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
      if (result.modifiedCount !== 1) throw Object.assign(new Error(`${item.name} is out of stock`), { status: 409 });
      changed.push(item);
    }
    const itemsPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shippingPrice = shippingFor(itemsPrice);
    const order = await Order.create({ user: req.user._id, items: items.map(({ product, ...item }) => ({ ...item, product: product._id })), shippingAddress, paymentMethod, isPaid: paymentMethod === 'cod', paidAt: paymentMethod === 'cod' ? new Date() : undefined, status: paymentMethod === 'cod' ? 'paid' : 'pending', itemsPrice, shippingPrice, totalPrice: itemsPrice + shippingPrice });
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    res.status(201).json(order);
  } catch (error) {
    if (changed.length) await Promise.all(changed.map((item) => Product.updateOne({ _id: item.product._id }, { $inc: { stock: item.qty } })));
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => { try { res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 })); } catch (error) { next(error); } };
export const getOrder = async (req, res, next) => {
  try { if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order id' }); const order = await Order.findById(req.params.id).populate('items.product', 'name slug'); if (!order) return res.status(404).json({ message: 'Order not found' }); if (!ownsOrder(order, req.user)) return res.status(403).json({ message: 'Not authorized to view this order' }); res.json(order); } catch (error) { next(error); }
};
export const cancelOrder = async (req, res, next) => {
  try { const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'Order not found' }); if (!ownsOrder(order, req.user)) return res.status(403).json({ message: 'Not authorized to cancel this order' }); if (!['pending', 'paid'].includes(order.status)) return res.status(400).json({ message: 'This order can no longer be cancelled' }); await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }))); order.status = 'cancelled'; await order.save(); res.json(order); } catch (error) { next(error); }
};