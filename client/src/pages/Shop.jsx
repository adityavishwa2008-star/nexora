import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { List, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { Breadcrumbs, Button, Drawer, Pagination, ProductGridSkeleton } from '../components/ui'
import { specialCollections } from '../data/categories'

const sortOptions = [
  ['featured', 'Featured'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'],
  ['rating', 'Avg. rating'], ['newest', 'Newest'], ['best_sellers', 'Best sellers'], ['biggest_discount', 'Biggest discount'],
]

const colorHex = { black: '#171717', white: '#f8f6ed', red: '#c84b42', blue: '#4776b5', green: '#638a53', silver: '#b8bec5', gold: '#c6a65b', pink: '#d88aa3', grey: '#8b918f' }

function flatten(tree = []) {
  return tree.flatMap((node) => [node, ...flatten(node.children)])
}

function readList(params, key) {
  return params.getAll(key).flatMap((value) => value.split(',')).filter(Boolean)
}

function FilterGroup({ title, children, defaultOpen = true }) {
  return <details className="catalogue-filter-group" open={defaultOpen}><summary>{title}</summary><div className="catalogue-filter-content">{children}</div></details>
}

function CategoryOptions({ categories, selectedCategory, selectedSubcategory, onSelectCategory, onSelectSubcategory }) {
  return <ul className="catalogue-category-tree">{categories.map((category) => <li key={category.slug}>
    <label><input type="checkbox" checked={selectedCategory === category.slug && !selectedSubcategory} onChange={() => onSelectCategory(selectedCategory === category.slug && !selectedSubcategory ? '' : category.slug)} /><span>{category.name}</span></label>
    {category.children?.length > 0 && <ul>{category.children.map((subcategory) => <li key={subcategory.slug}>
      <label><input type="checkbox" checked={selectedSubcategory === subcategory.slug} onChange={() => onSelectSubcategory(selectedSubcategory === subcategory.slug ? '' : subcategory.slug, category.slug)} /><span>{subcategory.name}</span></label>
    </li>)}</ul>}
  </li>)}</ul>
}

function FacetChecks({ items, selected, onToggle, limit = 6, renderLabel }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, limit)
  if (!items.length) return <p className="catalogue-no-facets">No options available</p>
  return <>
    {visible.map((item) => {
      const name = typeof item === 'string' ? item : item.name
      const count = typeof item === 'string' ? undefined : item.count
      return <label className="catalogue-check-row" key={name}><input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)} />{renderLabel ? renderLabel(name) : <span>{name}</span>}{count !== undefined && <small>{count}</small>}</label>
    })}
    {items.length > limit && <button className="show-more-button" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : 'Show more'}</button>}
  </>
}

function Shop() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [facets, setFacets] = useState({ brands: [], colors: [], sizes: [], price: { min: 0, max: 0 }, ratings: [] })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [loadedFingerprint, setLoadedFingerprint] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loadMore, setLoadMore] = useState([])
  const [priceDraft, setPriceDraft] = useState(() => ({ query: searchParams.toString(), min: searchParams.get('minPrice') || '', max: searchParams.get('maxPrice') || '' }))

  const routeCategory = slug || ''
  const keyword = searchParams.get('q') || searchParams.get('keyword') || ''
  const categorySlug = routeCategory || searchParams.get('category') || ''
  const subcategorySlug = searchParams.get('subcategory') || ''
  const collectionSlug = searchParams.get('collection') || ''
  const sort = searchParams.get('sort') || 'featured'
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(48, Math.max(12, Number(searchParams.get('limit') || 24)))
  const view = searchParams.get('view') === 'list' ? 'list' : 'grid'
  const brands = readList(searchParams, 'brand')
  const colors = readList(searchParams, 'colors')
  const sizes = readList(searchParams, 'sizes')
  const rating = searchParams.get('rating') || ''
  const minDiscount = searchParams.get('minDiscount') || ''
  const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true'
  const freeDelivery = searchParams.get('freeDelivery') === 'true'
  const drops = searchParams.get('drops') === 'true'
  const queryString = searchParams.toString()
  const currentPriceDraft = priceDraft.query === queryString ? priceDraft : { query: queryString, min: searchParams.get('minPrice') || '', max: searchParams.get('maxPrice') || '' }
  const requestFingerprint = `${queryString}|${routeCategory}|${limit}|${page}|${retry}`
  const loading = loadedFingerprint !== requestFingerprint

  const flatCategories = useMemo(() => flatten(categories), [categories])
  const currentCategory = flatCategories.find((item) => item.slug === subcategorySlug) || flatCategories.find((item) => item.slug === categorySlug)
  const collectionName = specialCollections.find((item) => item.slug === collectionSlug)?.name
  const pageTitle = keyword ? `Search results for “${keyword}”` : currentCategory?.name || collectionName || (categorySlug ? categorySlug.replaceAll('-', ' ') : 'Shop NEXORA')
  const categoryDescription = currentCategory ? `Shop our ${currentCategory.name.toLowerCase()} collection, selected for everyday use.` : ''

  const updateParams = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      next.delete(key)
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item))
      else if (value !== undefined && value !== null && value !== '') next.set(key, String(value))
    }
    if (resetPage) next.delete('page')
    setSearchParams(next)
  }

  const toggleParam = (key, value) => {
    const current = readList(searchParams, key)
    updateParams({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] })
  }

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(queryString)
      next.delete('minPrice')
      next.delete('maxPrice')
      if (currentPriceDraft.min !== '') next.set('minPrice', currentPriceDraft.min)
      if (currentPriceDraft.max !== '') next.set('maxPrice', currentPriceDraft.max)
      next.delete('page')
      if (next.toString() !== queryString) setSearchParams(next)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [currentPriceDraft.min, currentPriceDraft.max, queryString, setSearchParams])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams(queryString)
    if (routeCategory) params.set('category', routeCategory)
    const searchTerm = params.get('q') || params.get('keyword') || ''
    params.delete('q')
    params.delete('keyword')
    if (searchTerm) params.set('keyword', searchTerm)
    params.set('limit', String(limit))
    params.set('page', String(page))
    Promise.all([api.get('/products', { params }), api.get('/products/facets', { params })])
      .then(([productResponse, facetResponse]) => {
        if (!active) return
        const result = productResponse.data
        setProducts(result.products)
        setTotal(result.total)
        setPages(result.pages)
        setFacets(facetResponse.data)
        setLoadMore((current) => page > 1 ? [...current, ...result.products] : result.products)
        setError('')
        setLoadedFingerprint(requestFingerprint)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load products.')
          setLoadedFingerprint(requestFingerprint)
        }
      })
    return () => { active = false }
  }, [queryString, requestFingerprint, page, routeCategory, limit])

  const activeFilters = [...(categorySlug ? [['category', flatCategories.find((item) => item.slug === categorySlug)?.name || categorySlug]] : []), ...(subcategorySlug ? [['subcategory', currentCategory?.name || subcategorySlug]] : []), ...(collectionSlug ? [['collection', collectionName || collectionSlug]] : []), ...(keyword ? [[searchParams.has('q') ? 'q' : 'keyword', `“${keyword}”`]] : []), ...brands.map((value) => ['brand', value]), ...colors.map((value) => ['colors', value]), ...sizes.map((value) => ['sizes', value]), ...(rating ? [['rating', `${rating} stars & up`]] : []), ...(minDiscount ? [['minDiscount', `${minDiscount}%+ off`]] : []), ...(searchParams.has('minPrice') ? [['minPrice', `Min ${searchParams.get('minPrice')}`]] : []), ...(searchParams.has('maxPrice') ? [['maxPrice', `Max ${searchParams.get('maxPrice')}`]] : []), ...(freeDelivery ? [['freeDelivery', 'Free delivery']] : []), ...(drops ? [['drops', 'Drops only']] : []), ...(includeOutOfStock ? [['includeOutOfStock', 'Including out of stock']] : [])]
  const clearFilter = ([key, value]) => {
    if (['brand', 'colors', 'sizes'].includes(key)) toggleParam(key, value)
    else if (key === 'category' && routeCategory) navigate('/shop')
    else if (key === 'category') updateParams({ category: '', subcategory: '' })
    else updateParams({ [key]: '' })
  }
  const clearAll = () => {
    if (routeCategory) navigate('/shop')
    else setSearchParams(new URLSearchParams())
  }
  const changePage = (nextPage) => { setLoadMore([]); updateParams({ page: nextPage }, false) }
  const resultStart = total ? (page - 1) * limit + 1 : 0
  const resultEnd = Math.min(page * limit, total)
  const pageProducts = loadMore.length && page > 1 ? loadMore : products

  const sidebar = <>
    <FilterGroup title="Category" defaultOpen>
      <CategoryOptions categories={categories} selectedCategory={categorySlug} selectedSubcategory={subcategorySlug} onSelectCategory={(value) => { if (routeCategory) navigate(value ? `/shop?category=${value}` : '/shop'); else updateParams({ category: value, subcategory: '' }) }} onSelectSubcategory={(value, parentSlug) => { if (routeCategory) navigate(value ? `/shop?category=${parentSlug}&subcategory=${value}` : `/shop?category=${parentSlug}`); else updateParams({ category: parentSlug, subcategory: value }) }} />
    </FilterGroup>
    <FilterGroup title="Special Collections"><div className="catalogue-collections">{specialCollections.map((collection) => <label className="catalogue-check-row" key={collection.slug}><input type="checkbox" checked={collectionSlug === collection.slug} onChange={() => updateParams({ collection: collectionSlug === collection.slug ? '' : collection.slug })} /><span>{collection.name}</span></label>)}</div></FilterGroup>
    <FilterGroup title="Price" defaultOpen>
      <div className="price-range-slider"><input aria-label="Minimum price slider" type="range" min={facets.price.min || 0} max={facets.price.max || 1000} value={currentPriceDraft.min || facets.price.min || 0} onChange={(event) => setPriceDraft({ ...currentPriceDraft, query: queryString, min: event.target.value })} /><input aria-label="Maximum price slider" type="range" min={facets.price.min || 0} max={facets.price.max || 1000} value={currentPriceDraft.max || facets.price.max || 1000} onChange={(event) => setPriceDraft({ ...currentPriceDraft, query: queryString, max: event.target.value })} /></div>
      <div className="price-input-row"><label><span className="sr-only">Minimum price</span><input type="number" min="0" placeholder="Min" value={currentPriceDraft.min} onChange={(event) => setPriceDraft({ ...currentPriceDraft, query: queryString, min: event.target.value })} /></label><span>to</span><label><span className="sr-only">Maximum price</span><input type="number" min="0" placeholder="Max" value={currentPriceDraft.max} onChange={(event) => setPriceDraft({ ...currentPriceDraft, query: queryString, max: event.target.value })} /></label></div>
    </FilterGroup>
    <FilterGroup title="Brand"><FacetChecks items={facets.brands} selected={brands} onToggle={(name) => toggleParam('brand', name)} /></FilterGroup>
    <FilterGroup title="Customer rating"><div className="rating-filter-options">{[[4, '★★★★☆ & up'], [3, '★★★☆☆ & up']].map(([value, label]) => <label key={value}><input type="radio" name="rating-filter" checked={rating === String(value)} onChange={() => updateParams({ rating: String(value) })} />{label}</label>)}</div></FilterGroup>
    <FilterGroup title="Discount"><div className="discount-chip-list">{[10, 30, 50].map((value) => <button className={minDiscount === String(value) ? 'is-selected' : ''} type="button" key={value} onClick={() => updateParams({ minDiscount: minDiscount === String(value) ? '' : String(value) })}>{value}%+</button>)}</div></FilterGroup>
    <FilterGroup title="Availability"><label className="catalogue-check-row"><input type="checkbox" checked={includeOutOfStock} onChange={(event) => updateParams({ includeOutOfStock: event.target.checked ? 'true' : '', inStock: event.target.checked ? '' : 'true' })} /><span>Include out of stock</span></label></FilterGroup>
    <FilterGroup title="Color"><FacetChecks items={facets.colors} selected={colors} onToggle={(name) => toggleParam('colors', name)} renderLabel={(name) => <span className="color-option"><i style={{ background: colorHex[name.toLowerCase()] || '#8b918f' }} />{name}</span>} /></FilterGroup>
    <FilterGroup title="Size"><div className="size-chip-list">{facets.sizes.map((item) => <button type="button" className={sizes.includes(item.name) ? 'is-selected' : ''} key={item.name} onClick={() => toggleParam('sizes', item.name)}>{item.name}</button>)}{!facets.sizes.length && <p className="catalogue-no-facets">No sizes available</p>}</div></FilterGroup>
    <FilterGroup title="Delivery & collection"><label className="catalogue-check-row"><input type="checkbox" checked={freeDelivery} onChange={(event) => updateParams({ freeDelivery: event.target.checked ? 'true' : '' })} /><span>Free delivery</span></label><label className="catalogue-check-row"><input type="checkbox" checked={drops} onChange={(event) => updateParams({ drops: event.target.checked ? 'true' : '' })} /><span>Drops only</span></label></FilterGroup>
  </>

  return <section className="container catalogue-page page-section">
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(currentCategory ? [{ label: currentCategory.name }] : keyword ? [{ label: 'Search' }] : [])]} />
    {currentCategory && <header className="category-banner"><div><p className="eyebrow">NEXORA collection</p><h1>{currentCategory.name}</h1><p>{categoryDescription}</p></div>{currentCategory.image && <img src={currentCategory.image} alt="" />}</header>}
    {!currentCategory && <header className="catalogue-heading"><p className="eyebrow">{keyword ? 'Search the collection' : collectionName ? 'NEXORA collection' : 'The full collection'}</p><h1>{pageTitle}</h1><p>{keyword ? 'Explore matching products and related categories.' : collectionName ? `Explore the ${collectionName} edit.` : 'Browse practical objects and considered technology.'}</p></header>}
    <div className="catalogue-results-header"><p aria-live="polite">{total ? `${resultStart}-${resultEnd} of ${total} results${keyword ? ` for “${keyword}”` : ''}` : keyword ? `0 results for “${keyword}”` : 'No matching results'}</p><div className="catalogue-toolbar">
      <button className="filters-open-button" type="button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters{total ? ` (${total})` : ''}</button>
      <label className="catalogue-sort"><span>Sort by</span><select aria-label="Sort products" value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="view-toggle" aria-label="Product layout"><button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => updateParams({ view: 'grid' }, false)}>▦</button><button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => updateParams({ view: 'list' }, false)}><List size={18} /></button></div>
    </div></div>
    {activeFilters.length > 0 && <div className="applied-filters" aria-label="Applied filters">{activeFilters.map((filter) => <button type="button" key={filter.join(':')} onClick={() => clearFilter(filter)}>{filter[1]} <X size={13} aria-hidden="true" /></button>)}<button className="clear-filters" type="button" onClick={clearAll}>Clear all</button></div>}
    <div className="catalogue-layout"><aside className="catalogue-sidebar" aria-label="Product filters">{sidebar}</aside>
      <div className="catalogue-results" aria-busy={loading}>
        {loading ? <ProductGridSkeleton count={limit > 24 ? 8 : 6} /> : error ? <div className="empty-state"><h2>Products unavailable</h2><p className="form-error" role="alert">{error}</p><Button type="button" onClick={() => setRetry((current) => current + 1)}>Try again</Button></div> : pageProducts.length ? <>
          <div className={`catalogue-product-grid ${view === 'list' ? 'is-list-view' : ''}`}>{pageProducts.map((product) => <ProductCard product={product} key={product._id} onSale={Boolean(product.mrp > product.price)} />)}</div>
          <div className="catalogue-bottom-controls"><label>Show <select value={limit} onChange={(event) => updateParams({ limit: event.target.value })}><option value="12">12</option><option value="24">24</option><option value="48">48</option></select> per page</label><Pagination page={page} pages={pages} onChange={changePage} />{page < pages && <Button variant="secondary" type="button" onClick={() => { updateParams({ page: page + 1 }, false) }}>Load more</Button>}</div>
        </> : <div className="catalogue-empty empty-state"><p className="eyebrow">Nothing in this aisle</p><h2>{categorySlug || subcategorySlug ? 'We’re curating this category' : 'No products match those filters'}</h2><p>{categorySlug || subcategorySlug ? `There are no products in ${currentCategory?.name || categorySlug.replaceAll('-', ' ')} yet. Check back soon for the first pieces.` : 'Remove a filter or try a wider search to see more of the collection.'}</p><Button type="button" onClick={clearAll}>Clear all filters</Button><div className="empty-category-links">{categories.slice(0, 4).map((item) => <Link key={item.slug} to={`/shop?category=${item.slug}`}>{item.name}</Link>)}</div></div>}
      </div>
    </div>
    <Drawer open={filtersOpen} title="Filters" side="bottom" onClose={() => setFiltersOpen(false)}><div className="mobile-filter-content">{sidebar}</div><div className="mobile-filter-apply"><span>{total} results</span><Button type="button" onClick={() => setFiltersOpen(false)}>Apply</Button></div></Drawer>
  </section>
}

export default Shop