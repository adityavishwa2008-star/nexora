import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'

function ProductDetail() {
  const { id } = useParams()
  const [result, setResult] = useState({ id: null, product: null, error: '' })

  useEffect(() => {
    let active = true
    api.get(`/products/${id}`)
      .then(({ data }) => { if (active) setResult({ id, product: data, error: '' }) })
      .catch((requestError) => {
        if (active) setResult({ id, product: null, error: requestError.response?.data?.message || 'Unable to load this product.' })
      })
    return () => { active = false }
  }, [id])

  const currentResult = result.id === id ? result : null
  if (!currentResult) return <section className="container page-section"><p className="status-message" role="status">Loading product…</p></section>
  if (currentResult.error) return <section className="container page-section"><div className="empty-state"><h2>Product unavailable</h2><p className="form-error" role="alert">{currentResult.error}</p><Link className="button" to="/shop">Back to shop</Link></div></section>
  if (!currentResult.product) return null

  const { product } = currentResult

  return (
    <section className="container page-section product-detail">
      <img className="product-detail-image" src={product.images?.[0]} alt={product.name} />
      <div className="product-detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="product-detail-price">${Number(product.price).toFixed(2)}</p>
        <p className="product-detail-description">{product.description}</p>
        <p className="stock">★ {product.rating} · {product.stock} in stock</p>
        <Link className="text-link" to="/shop">← Back to the collection</Link>
      </div>
    </section>
  )
}

export default ProductDetail