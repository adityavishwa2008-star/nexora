import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import { Breadcrumbs, PriceTag, RatingStars, Skeleton } from '../components/ui'

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
  if (!currentResult) return <section className="container page-section product-detail" role="status" aria-label="Loading product"><Skeleton className="detail-skeleton-image" /><div><Skeleton className="skeleton-eyebrow" /><Skeleton className="skeleton-title" /><Skeleton className="skeleton-meta" /></div></section>
  if (currentResult.error) return <section className="container page-section"><div className="empty-state"><h2>Product unavailable</h2><p className="form-error" role="alert">{currentResult.error}</p><Link className="button" to="/shop">Back to shop</Link></div></section>
  if (!currentResult.product) return null

  const { product } = currentResult

  return (
    <section className="container page-section product-detail">
      <img className="product-detail-image" src={product.images?.[0]} alt={product.name} />
      <div className="product-detail-copy">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: product.name }]} />
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="product-detail-price"><PriceTag price={product.price} mrp={product.mrp} /></p>
        <p className="product-detail-description">{product.description}</p>
        <p className="stock"><RatingStars rating={product.rating} count={product.numReviews} /> · {product.stock} in stock</p>
        <Link className="text-link" to="/shop">← Back to the collection</Link>
      </div>
    </section>
  )
}

export default ProductDetail