import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { ApiErrorState, Button, PriceTag, QuantityStepper, Toast } from '../components/ui'

function Cart() {
  const { cart, loading, error, setQty, remove } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState('')
  const rows = cart.items || []
  const subtotal = rows.reduce((sum, item) => sum + Number(item.product.discountPrice ?? item.product.price) * item.qty, 0)
  const shipping = subtotal >= 999 ? 0 : 79
  const update = async (action, message) => { try { await action(); setToast(message) } catch (requestError) { setToast(requestError.message) } }

  return <section className="container page-section local-list-page">
    <p className="eyebrow">Your bag</p><h1>Cart</h1>
    {error && <p className="form-error" role="alert">{error}</p>}
    {error ? <ApiErrorState message={error} onRetry={() => window.location.reload()} /> : loading ? <p className="status-message">Loading your cart...</p> : !rows.length ? <div className="empty-state"><p className="status-message">Your cart is waiting for its first good find.</p><Link className="button" to="/shop">Explore the collection</Link></div> : <div className="local-list-layout"><div className="local-list-items">{rows.map(({ product, qty }) => <article className="local-list-item" key={product._id}>
      <img src={product.images?.[0]} alt={product.name} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
      <div className="local-list-item-copy"><p className="eyebrow">{product.category}</p><h2><Link to={`/products/${product._id}`}>{product.name}</Link></h2><PriceTag price={product.discountPrice ?? product.price} mrp={product.discountPrice ? product.price : undefined} /></div>
      <QuantityStepper value={qty} max={Math.max(1, product.stock)} onChange={(value) => update(() => setQty(product._id, value), 'Cart updated.')} /><button className="icon-button" type="button" aria-label={`Remove ${product.name}`} onClick={() => update(() => remove(product._id), 'Removed from cart.')}><Trash2 size={17} /></button>
    </article>)}</div><aside className="local-list-summary"><p className="eyebrow">Order summary</p><div><span>Subtotal</span><strong><PriceTag price={subtotal} /></strong></div><div><span>Shipping</span><strong>{shipping ? <PriceTag price={shipping} /> : 'Free'}</strong></div><div><span>Total</span><strong><PriceTag price={subtotal + shipping} /></strong></div><p>Free shipping on orders above ₹999.</p><Button type="button" onClick={() => navigate('/checkout', { state: { from: location } })}>Checkout</Button></aside></div>}
    <Toast message={toast} onClose={() => setToast('')} />
  </section>
}

export default Cart