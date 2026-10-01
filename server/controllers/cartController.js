import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const populateCart = (id) => Cart.findOne({ user: id }).populate('items.product', 'name price discountPrice images stock');

export const getCart = async (req, res, next) => {
  try { res.json(await populateCart(req.user._id) || { user: req.user._id, items: [] }); } catch (error) { next(error); }
};

export const addToCart = async (req, res, next) => {
  try {
    const { product: productId, qty = 1 } = req.body;
    const amount = Number(qty);
    if (!/^[a-f\d]{24}$/i.test(productId) || !Number.isInteger(amount) || amount < 1) return res.status(400).json({ message: 'Product and a positive integer qty are required' });
    const product = await Product.findById(productId).select('stock');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { $setOnInsert: { user: req.user._id } }, { upsert: true, new: true });
    const item = cart.items.find((entry) => entry.product.toString() === productId);
    const nextQty = (item?.qty || 0) + amount;
    if (nextQty > product.stock) return res.status(400).json({ message: `Only ${product.stock} item(s) available` });
    if (item) item.qty = nextQty; else cart.items.push({ product: productId, qty: amount });
    await cart.save();
    res.status(201).json(await populateCart(req.user._id));
  } catch (error) { next(error); }
};

export const setCartQty = async (req, res, next) => {
  try {
    const qty = Number(req.body.qty);
    if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ message: 'qty must be a positive integer' });
    const product = await Product.findById(req.params.productId).select('stock');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (qty > product.stock) return res.status(400).json({ message: `Only ${product.stock} item(s) available` });
    const cart = await Cart.findOne({ user: req.user._id });
    const item = cart?.items.find((entry) => entry.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    item.qty = qty; await cart.save(); res.json(await populateCart(req.user._id));
  } catch (error) { next(error); }
};

export const removeFromCart = async (req, res, next) => {
  try { await Cart.updateOne({ user: req.user._id }, { $pull: { items: { product: req.params.productId } } }); res.json(await populateCart(req.user._id) || { items: [] }); } catch (error) { next(error); }
};
export const clearCart = async (req, res, next) => {
  try { await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } }, { upsert: true }); res.json({ items: [] }); } catch (error) { next(error); }
};