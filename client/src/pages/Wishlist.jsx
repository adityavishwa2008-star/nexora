import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { Button, PriceTag, Toast } from '../components/ui'

function Wishlist() {
  const { wishlist, remove } = useWishlist()
  const { add } = useCart()
  const [toast, setToast] = useState('')
  const moveToCart = async (product) => { try { await add(product); await remove(product._id); setToast('Moved to cart.') } catch (error) { setToast(error.message) } }
  return <section className="container page-section local-list-page"><p className="eyebrow">Saved for later</p><h1>Wishlist</h1>{!wishlist.products.length ? <div className="empty-state"><Heart size={30} aria-hidden="true" /><p className="status-message">Keep the pieces you are thinking about close.</p><Link className="button" to="/shop">Browse products</Link></div> : <div className="wishlist-grid">{wishlist.products.map((product) => <article className="wishlist-item" key={product._id}><Link to={`/products/${product._id}`}><img src={product.images?.[0]} alt={product.name} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} /></Link><div><p className="eyebrow">{product.category}</p><h2><Link to={`/products/${product._id}`}>{product.name}</Link></h2><PriceTag price={product.discountPrice ?? product.price} mrp={product.discountPrice ? product.price : undefined} /><Button type="button" onClick={() => moveToCart(product)}><ShoppingBag size={15} /> Move to cart</Button></div><button className="icon-button" type="button" aria-label={`Remove ${product.name} from wishlist`} onClick={() => remove(product._id).catch((error) => setToast(error.message))}><Trash2 size={17} /></button></article>)}</div>}<Toast message={toast} onClose={() => setToast('')} /></section>
}

export default Wishlist