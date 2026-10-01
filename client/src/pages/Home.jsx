import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { ApiErrorState, ProductGridSkeleton } from '../components/ui'
import { imageDimensionsByPath } from '../data/products'

const heroImage = '/images/products/layered-cross-chain.jpg'
const categoryImageAlt = {
  belts: 'Gothic Cross Buckle Leather Belt',
  'chains-necklaces': 'Silver Cross Pendant Ball Chain',
  'retro-tech': 'Retro Silver MP3 Player with Earbuds',
}

function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const heroDimensions = imageDimensionsByPath[heroImage]

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/categories'),
      api.get('/products', { params: { limit: 3, sort: 'rating' } }),
    ])
      .then(([categoryResponse, productResponse]) => {
        if (!active) return
        setCategories(categoryResponse.data)
        setProducts(productResponse.data.products)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load the collection.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  return (
    <>
      <section className="hero-section">
        <div className="container hero-layout">
          <div className="hero-content">
            <p className="eyebrow">The NEXORA edit / 01</p>
            <h1>Useful things, beautifully considered.</h1>
            <p className="hero-copy">Everyday pieces with a little extra edge. Find your next rotation.</p>
            <Link className="button" to="/shop">Explore the collection</Link>
          </div>
          <figure className="hero-image-card">
            <img src={heroImage} alt="Layered Cross-Link Chain Set" width={heroDimensions.width} height={heroDimensions.height} loading="eager" style={{ objectPosition: '50% 80%', maxWidth: `${heroDimensions.width * 1.5}px` }} />
            <figcaption><span>NEW ROTATION</span><strong>Layered Cross-Link Chain Set</strong></figcaption>
          </figure>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start somewhere</p>
            <h2>Shop by category</h2>
          </div>
          <Link to="/shop" className="text-link">View all products →</Link>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link className="category-card" to={`/c/${category.slug}`} key={category._id}>
              {category.image && (() => {
                const dimensions = imageDimensionsByPath[category.image] || { width: 386, height: 518 }
                return <img className="category-card-image" src={category.image} alt={categoryImageAlt[category.slug] || category.name} width={dimensions.width} height={dimensions.height} loading="lazy" style={{ maxWidth: `${dimensions.width * 1.5}px` }} />
              })()}
              <span>0{index + 1}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A considered shortlist</p>
            <h2>Featured products</h2>
          </div>
        </div>
        {loading ? <ProductGridSkeleton count={3} /> : error ? <ApiErrorState message={error} onRetry={() => { setError(''); setLoading(true); setRetry((value) => value + 1) }} /> : products.length ? (
          <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product._id} />)}</div>
        ) : <p className="status-message">No products are available yet.</p>}
      </section>

      <section className="benefits-band">
        <div className="container benefits-grid">
          <div><strong>01 / Carefully chosen</strong><p>Less noise, better essentials.</p></div>
          <div><strong>02 / Ready to ship</strong><p>Fast delivery on every product.</p></div>
          <div><strong>03 / Here to help</strong><p>Real support from real people.</p></div>
        </div>
      </section>
    </>
  )
}

export default Home
