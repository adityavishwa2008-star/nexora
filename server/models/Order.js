import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, name: String, price: { type: Number, required: true }, qty: { type: Number, min: 1, required: true }, image: String }],
  shippingAddress: { name: String, phone: String, line1: String, city: String, state: String, pincode: String },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  paymentResult: { razorpayOrderId: String, razorpayPaymentId: String },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);