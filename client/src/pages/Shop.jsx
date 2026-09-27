import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { categories, products } from '../data/products'

function Shop() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || product.category === category
    return matchesSearch && matchesCategory
  }), [category, search])

  return (
    <section className="container page-section">
      <div className="page-heading">
        <p className="eyebrow">The full collection</p>
        <h1>Shop NEXORA</h1>
        <p>Browse our starting catalog of practical objects and considered technology.</p>
      </div>
      <div className="shop-controls">
        <label>
          <span className="sr-only">Search products</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {filteredProducts.length > 0 ? (
        <div className="product-grid">{filteredProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
      ) : (
        <div className="empty-state"><h2>No products found</h2><p>Try a different search or category.</p></div>
      )}
    </section>
  )
}

export default Shop
