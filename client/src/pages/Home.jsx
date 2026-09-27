import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { categories, products } from '../data/products'

function Home() {
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
            <Link className="category-card" to={`/shop?category=${category}`} key={category}>
              <span>0{index + 1}</span>
              <strong>{category}</strong>
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
        <div className="product-grid">
          {products.slice(0, 3).map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
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
