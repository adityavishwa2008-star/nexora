import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingBag } from 'lucide-react'
import { Badge, Button, Modal, PriceTag, QuantityStepper, RatingStars, Toast } from './ui'

function ProductCard({ product }) {
  const productId = product._id || product.id
  const image = product.images?.[0] || product.image
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [color, setColor] = useState(product.colors?.[0] || '')
  const [size, setSize] = useState(product.sizes?.[0] || '')
  const [toast, setToast] = useState('')

  const addToCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('nexoraCart') || '[]')
      const existing = cart.find((item) => item.productId === productId && item.color === color && item.size === size)
      if (existing) existing.quantity += quantity
      else cart.push({ productId, quantity, color, size })
      localStorage.setItem('nexoraCart', JSON.stringify(cart))
      window.dispatchEvent(new Event('nexora-storage'))
      setToast('Added to cart.')
    } catch {
      setToast('Could not update cart.')
    }
  }

  return (
    <article className="product-card catalogue-card">
      <Link to={`/products/${productId}`} className="product-image-link">
        <img src={image} alt={product.name} className="product-image" />
      </Link>
      <button className="quick-view-trigger" type="button" aria-label={`Quick view ${product.name}`} onClick={() => setQuickViewOpen(true)}><Eye size={16} /><span>Quick view</span></button>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={`/products/${productId}`}>{product.name}</Link></h3>
        <div className="product-meta">
          <PriceTag price={product.price} mrp={product.mrp} />
          <RatingStars rating={product.rating} count={product.numReviews} />
        </div>
        <p className="stock">{product.stock} in stock</p>
        <ul className="catalogue-card-bullets"><li>{product.description}</li>{product.freeDelivery && <li>Free delivery available</li>}{product.drops && <li>Limited drop</li>}</ul>
        {product.drops && <Badge className="product-drop-badge">Drop</Badge>}
      </div>
      <Modal open={quickViewOpen} title={product.name} onClose={() => setQuickViewOpen(false)} className="quick-view-modal">
        <div className="quick-view-content">
          <img src={image} alt={product.name} />
          <div className="quick-view-details">
            <p className="eyebrow">{product.category}{product.brand ? ` · ${product.brand}` : ''}</p>
            <PriceTag price={product.price} mrp={product.mrp} />
            <RatingStars rating={product.rating} count={product.numReviews} />
            <p>{product.description}</p>
            <p className="stock">{product.stock} in stock</p>
            {!!product.colors?.length && <label>Color<select value={color} onChange={(event) => setColor(event.target.value)}>{product.colors.map((value) => <option key={value}>{value}</option>)}</select></label>}
            {!!product.sizes?.length && <label>Size<select value={size} onChange={(event) => setSize(event.target.value)}>{product.sizes.map((value) => <option key={value}>{value}</option>)}</select></label>}
            <div className="quick-view-actions"><QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, product.stock)} /><Button type="button" disabled={product.stock < 1} onClick={addToCart}><ShoppingBag size={16} /> Add to cart</Button></div>
            <Link className="text-link" to={`/products/${productId}`} onClick={() => setQuickViewOpen(false)}>View full details</Link>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onClose={() => setToast('')} />
    </article>
  )
}

export default ProductCard
