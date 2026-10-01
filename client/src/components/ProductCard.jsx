import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, Heart, ShoppingBag } from 'lucide-react'
import { Badge, Button, Modal, PriceTag, QuantityStepper, RatingStars, Toast } from './ui'
import { imageDimensionsByPath } from '../data/products'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

function ProductCard({ product }) {
  const productId = product._id || product.id
  const navigate = useNavigate()
  const location = useLocation()
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const image = product.images?.[0] || product.image
  const dimensions = imageDimensionsByPath[image] || { width: 386, height: 518 }
  const imageStyle = { objectPosition: product.imageFocus || '50% 50%', maxWidth: `${dimensions.width * 1.5}px` }
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [color, setColor] = useState(product.colors?.[0] || '')
  const [size, setSize] = useState(product.sizes?.[0] || '')
  const [toast, setToast] = useState('')
  const saved = has(productId)

  const addToCart = async () => { try { await add(product, quantity); setToast('Added to cart.') } catch (error) { if (!localStorage.getItem('nexoraToken')) navigate('/login', { state: { from: location } }); else setToast(error.message) } }

  const toggleWishlist = () => {
    toggle(productId).then(() => setToast(saved ? 'Removed from wishlist.' : 'Saved to wishlist.')).catch((error) => { if (!localStorage.getItem('nexoraToken')) navigate('/login', { state: { from: location } }); else setToast(error.message) })
  }

  return (
    <article className="product-card catalogue-card">
      <Link to={`/products/${productId}`} className="product-image-link">
        <img src={image} alt={product.name} className="product-image" width={dimensions.width} height={dimensions.height} loading="lazy" style={imageStyle} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/products/placeholder.jpg' }} />
      </Link>
      <button className="quick-view-trigger" type="button" aria-label={`Quick view ${product.name}`} onClick={() => setQuickViewOpen(true)}><Eye size={16} /><span>Quick view</span></button>
      <button className={`wishlist-card-button ${saved ? 'is-saved' : ''}`} type="button" aria-label={`${saved ? 'Remove' : 'Add'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={toggleWishlist}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={`/products/${productId}`}>{product.name}</Link></h3>
        <div className="product-meta">
          <PriceTag price={product.discountPrice ?? product.price} mrp={product.discountPrice ? product.price : product.mrp} />
          <RatingStars rating={product.rating} count={product.numReviews} />
        </div>
        <p className="stock">{product.stock} in stock</p>
        <ul className="catalogue-card-bullets"><li>{product.description}</li>{product.freeDelivery && <li>Free delivery available</li>}{product.drops && <li>Limited drop</li>}</ul>
        {product.drops && <Badge className="product-drop-badge">Drop</Badge>}
      </div>
      <Modal open={quickViewOpen} title={product.name} onClose={() => setQuickViewOpen(false)} className="quick-view-modal">
        <div className="quick-view-content">
          <img src={image} alt={product.name} width={dimensions.width} height={dimensions.height} loading="lazy" style={imageStyle} />
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
