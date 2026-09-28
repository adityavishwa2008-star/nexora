import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

function Shop() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category')?.toLowerCase() || 'all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    api.get('/products/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let active = true
    const params = { page, limit: 12, sort }
    if (search.trim()) params.keyword = search.trim()
    if (category !== 'all') params.category = category
    if (minPrice !== '') params.minPrice = minPrice
    if (maxPrice !== '') params.maxPrice = maxPrice

    api.get('/products', { params })
      .then(({ data }) => {
        if (!active) return
        setProducts(data.products)
        setPages(data.pages)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load products.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [category, maxPrice, minPrice, page, retry, search, sort])

  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
    setLoading(true)
    setError('')
  }

  const changePage = (nextPage) => {
    setPage(nextPage)
    setLoading(true)
  }

  return (
    <section className="container page-section">
      <div className="page-heading">
        <p className="eyebrow">The full collection</p>
        <h1>Shop NEXORA</h1>
        <p>Browse practical objects and considered technology.</p>
      </div>
      <div className="shop-controls">
        <label>
          <span className="sr-only">Search products</span>
          <input value={search} onChange={updateFilter(setSearch)} placeholder="Search products" />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={updateFilter(setCategory)}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item.replace(/^./, (letter) => letter.toUpperCase())}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Minimum price</span><input type="number" min="0" step="0.01" value={minPrice} onChange={updateFilter(setMinPrice)} placeholder="Min price" /></label>
        <label><span className="sr-only">Maximum price</span><input type="number" min="0" step="0.01" value={maxPrice} onChange={updateFilter(setMaxPrice)} placeholder="Max price" /></label>
        <label><span className="sr-only">Sort products</span><select value={sort} onChange={updateFilter(setSort)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select></label>
      </div>
      {loading ? <p className="status-message" role="status">Loading products…</p> : error ? (
        <div className="empty-state"><h2>Products unavailable</h2><p className="form-error" role="alert">{error}</p><button className="button" type="button" onClick={() => { setLoading(true); setRetry((current) => current + 1) }}>Try again</button></div>
      ) : products.length > 0 ? (
        <>
          <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product._id} />)}</div>
          <nav className="pagination" aria-label="Product pages">
            <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => changePage(page + 1)}>Next</button>
          </nav>
        </>
      ) : (
        <div className="empty-state"><h2>No products found</h2><p>Try a different search or category.</p></div>
      )}
    </section>
  )
}

export default Shop
