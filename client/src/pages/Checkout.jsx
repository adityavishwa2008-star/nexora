import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { Button, PriceTag } from '../components/ui'

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = resolve; script.onerror = () => reject(new Error('Unable to load payment gateway.')); document.body.appendChild(script)
  })
}

const blankAddress = { name: '', phone: '', line1: '', city: '', state: '', pincode: '' }

function Checkout() {
  const { cart, refresh } = useCart(); const navigate = useNavigate(); const [step, setStep] = useState(1); const [method, setMethod] = useState('cod'); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [savedAddresses, setSavedAddresses] = useState([]); const [address, setAddress] = useState(blankAddress)
  useEffect(() => { api.get('/auth/addresses').then(({ data }) => { setSavedAddresses(data); const selected = data.find((item) => item.isDefault) || data[0]; if (selected) setAddress(selected) }).catch(() => {}) }, [])
  const subtotal = (cart.items || []).reduce((sum, item) => sum + Number(item.product.discountPrice ?? item.product.price) * item.qty, 0); const shipping = subtotal >= 999 ? 0 : 79; const total = subtotal + shipping
  const update = (event) => setAddress({ ...address, [event.target.name]: event.target.value })
  const placeOrder = async () => {
    if (Object.values(address).some((value) => !value || !String(value).trim())) { setError('Complete every address field before placing the order.'); return }
    setSaving(true); setError('')
    try { const { data: order } = await api.post('/orders', { shippingAddress: address, paymentMethod: method }); await refresh(); if (method === 'cod') return navigate(`/orders/${order._id}/success`); await loadRazorpay(); const { data: payment } = await api.post('/payment/create', { orderId: order._id }); const gateway = new window.Razorpay({ key: payment.keyId, amount: payment.amount, currency: payment.currency, name: 'NEXORA', description: `Order ${order._id}`, order_id: payment.orderId, handler: async (response) => { try { await api.post('/payment/verify', { orderId: order._id, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }); navigate(`/orders/${order._id}/success`) } catch (requestError) { navigate(`/orders/${order._id}`, { state: { error: requestError.response?.data?.message || 'Payment verification failed.' } }) } }, modal: { ondismiss: () => navigate(`/orders/${order._id}`, { state: { error: 'Payment was cancelled. Your order is still pending.' } }) } }); gateway.open() } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Unable to place order.') } finally { setSaving(false) }
  }
  if (!cart.items?.length) return <section className="container page-section empty-state"><h1>Your cart is empty</h1><Button type="button" onClick={() => navigate('/shop')}>Browse products</Button></section>
  return <section className="container page-section checkout-page"><p className="eyebrow">Secure checkout</p><h1>Checkout</h1><div className="checkout-steps"><strong className={step >= 1 ? 'is-active' : ''}>1 Address</strong><strong className={step >= 2 ? 'is-active' : ''}>2 Payment</strong><strong className={step >= 3 ? 'is-active' : ''}>3 Review</strong></div>{error && <p className="form-error" role="alert">{error}</p>}{step === 1 && <div className="auth-form checkout-form">{savedAddresses.length > 0 && <label>Saved address<select value={address._id || ''} onChange={(event) => setAddress(savedAddresses.find((item) => item._id === event.target.value) || blankAddress)}><option value="">Add a new address</option>{savedAddresses.map((item) => <option value={item._id} key={item._id}>{item.name}, {item.city} {item.pincode}</option>)}</select></label>}{Object.entries(blankAddress).map(([name]) => <label key={name}>{name === 'line1' ? 'Address' : name[0].toUpperCase() + name.slice(1)}<input name={name} value={address[name] || ''} onChange={update} required /></label>)}<Button type="button" onClick={() => setStep(2)}>Continue to payment</Button></div>}{step === 2 && <div className="checkout-panel"><label className="payment-choice"><input type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} /> Cash on Delivery</label><label className="payment-choice"><input type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} /> Razorpay test payment</label><Button type="button" onClick={() => setStep(3)}>Review order</Button></div>}{step === 3 && <div className="checkout-panel"><h2>Review</h2><p>{address.name}, {address.phone}</p><p>{address.line1}, {address.city}, {address.state} {address.pincode}</p><div className="local-list-summary"><div><span>Items</span><strong><PriceTag price={subtotal} /></strong></div><div><span>Shipping</span><strong>{shipping ? <PriceTag price={shipping} /> : 'Free'}</strong></div><div><span>Total</span><strong><PriceTag price={total} /></strong></div><Button type="button" disabled={saving} onClick={placeOrder}>{saving ? 'Processing...' : method === 'cod' ? 'Place COD order' : 'Pay with Razorpay'}</Button></div></div>}</section>
}

export default Checkout