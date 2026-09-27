import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image-link">
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <div className="product-meta">
          <strong>${product.price.toFixed(2)}</strong>
          <span>★ {product.rating}</span>
        </div>
        <p className="stock">{product.stock} in stock</p>
      </div>
    </article>
  )
}

export default ProductCard
