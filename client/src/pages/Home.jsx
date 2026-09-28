import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ui'

function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/products/categories'),
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
  }, [])

  return (
    <>
      <section className="hero-section">
        <div className="container hero-content">
          <p className="eyebrow">The NEXORA edit / 01</p>
          <h1>Useful things, beautifully considered.</h1>
          <p className="hero-copy">Discover a focused collection of everyday technology and objects designed to earn their place in your life.</p>
          <Link className="button" to="/shop">Explore the collection</Link>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-core">NX</div>
          <span className="orbit-label">EST. 2026</span>
        </div>
        <div className="hero-stamp" aria-hidden="true">N / 26</div>
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
        {loading ? <ProductGridSkeleton count={3} /> : error ? <p className="form-error" role="alert">{error}</p> : products.length ? (
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
