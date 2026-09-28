import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  const productId = product._id || product.id
  const image = product.images?.[0] || product.image

  return (
    <article className="product-card">
      <Link to={`/products/${productId}`} className="product-image-link">
        <img src={image} alt={product.name} className="product-image" />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={`/products/${productId}`}>{product.name}</Link></h3>
        <div className="product-meta">
          <strong>${Number(product.price).toFixed(2)}</strong>
          <span>★ {product.rating}</span>
        </div>
        <p className="stock">{product.stock} in stock</p>
      </div>
    </article>
  )
}

export default ProductCard
