import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, Grid2X2, Heart, Home, MapPin, Menu, Moon, Search, ShoppingBag, Sun, Tag, UserRound } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/auth'
import { Badge, Button, Drawer, Modal, Toast } from './ui'

function flattenCategories(categories = []) {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}

function readCount(storageKey, quantityKey) {
  try {
    const entries = JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (!Array.isArray(entries)) return 0
    return entries.reduce((total, item) => total + (quantityKey ? Number(item.quantity || item.qty || 1) : 1), 0)
  } catch {
    return 0
  }
}

function CategoryTree({ categories, onSelect }) {
  return <ul className="category-tree">{categories.map((category) => <li key={category._id}>
    <button type="button" onClick={() => onSelect(category)}>{category.name}</button>
    {category.children?.length > 0 && <CategoryTree categories={category.children} onSelect={onSelect} />}
  </li>)}</ul>
}

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], brands: [] })
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexoraRecentSearches') || '[]').slice(0, 5) } catch { return [] }
  })
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [pincode, setPincode] = useState(() => localStorage.getItem('nexoraPincode') || '')
  const [pincodeInput, setPincodeInput] = useState(pincode)
  const [locationOpen, setLocationOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [compact, setCompact] = useState(() => window.scrollY > 28)
  const [theme, setTheme] = useState(() => localStorage.getItem('nexoraTheme') || 'dark')
  const [counts, setCounts] = useState({ cart: 0, wishlist: 0 })
  const [toast, setToast] = useState('')
  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

  const loadCategories = () => {
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch((error) => setCategoryError(error.response?.data?.message || 'Could not load categories.'))
  }

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    const term = keyword.trim()
    if (term.length < 2) {
      return undefined
    }
    const timer = window.setTimeout(() => {
      api.get('/search/suggest', { params: { q: term } })
        .then(({ data }) => setSuggestions(data))
        .catch(() => setSuggestions({ products: [], categories: [], brands: [] }))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('nexoraTheme', theme)
  }, [theme])

  useEffect(() => {
    const updateScroll = () => setCompact(window.scrollY > 28)
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  useEffect(() => {
    const refreshCounts = () => setCounts({ cart: readCount('nexoraCart', true), wishlist: readCount('nexoraWishlist', false) })
    refreshCounts()
    window.addEventListener('storage', refreshCounts)
    window.addEventListener('nexora-storage', refreshCounts)
    return () => {
      window.removeEventListener('storage', refreshCounts)
      window.removeEventListener('nexora-storage', refreshCounts)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const term = keyword.trim()
    if (term) rememberSearch(term)
    if (category) {
      const params = new URLSearchParams({ category })
      if (term) params.set('keyword', term)
      navigate(`/shop?${params}`)
    } else {
      navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/shop')
    }
    setSuggestionsOpen(false)
    setMobileOpen(false)
  }

  const rememberSearch = (term) => {
    const next = [term, ...recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    setRecentSearches(next)
    localStorage.setItem('nexoraRecentSearches', JSON.stringify(next))
  }

  const suggestionItems = [
    ...suggestions.products.map((item) => ({ type: 'product', label: item.name, item })),
    ...suggestions.categories.map((item) => ({ type: 'category', label: item.name, item })),
    ...suggestions.brands.map((item) => ({ type: 'brand', label: item, item })),
  ].slice(0, 8)

  const chooseSuggestion = (suggestion) => {
    if (suggestion.type === 'product') {
      rememberSearch(suggestion.label)
      navigate(`/products/${suggestion.item._id}`)
    } else if (suggestion.type === 'category') {
      navigate(`/c/${suggestion.item.slug}`)
    } else {
      rememberSearch(suggestion.label)
      navigate(`/search?q=${encodeURIComponent(suggestion.label)}`)
    }
    setSuggestionsOpen(false)
  }

  const handleSearchKeyDown = (event) => {
    const visibleCount = keyword.trim().length >= 2 ? suggestionItems.length : recentSearches.length
    if (event.key === 'Escape') setSuggestionsOpen(false)
    if (event.key === 'ArrowDown' && visibleCount) {
      event.preventDefault()
      setSuggestionIndex((index) => (index + 1) % visibleCount)
    }
    if (event.key === 'ArrowUp' && visibleCount) {
      event.preventDefault()
      setSuggestionIndex((index) => (index - 1 + visibleCount) % visibleCount)
    }
    if (event.key === 'Enter' && suggestionIndex >= 0 && visibleCount) {
      event.preventDefault()
      if (keyword.trim().length >= 2) chooseSuggestion(suggestionItems[suggestionIndex])
      else {
        setKeyword(recentSearches[suggestionIndex])
        rememberSearch(recentSearches[suggestionIndex])
        navigate(`/search?q=${encodeURIComponent(recentSearches[suggestionIndex])}`)
        setSuggestionsOpen(false)
      }
    }
  }

  const savePincode = (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(pincodeInput.trim())) {
      setToast('Enter a valid 6-digit pincode.')
      return
    }
    const value = pincodeInput.trim()
    localStorage.setItem('nexoraPincode', value)
    setPincode(value)
    setLocationOpen(false)
  }

  const chooseCategory = (selectedCategory) => {
    navigate(`/c/${selectedCategory.slug}`)
    setCategoryOpen(false)
    setMobileOpen(false)
  }

  const showCategories = () => {
    setCategoryOpen(true)
    setMobileOpen(false)
    if (!categories.length && !categoryError) loadCategories()
  }

  const focusSearch = () => {
    navigate('/shop')
    window.setTimeout(() => document.getElementById('header-keyword')?.focus(), 0)
  }

  const categoryLinks = flatCategories.slice(0, 4)

  return (
    <>
      <header className={`site-header ${compact ? 'is-compact' : ''}`}>
        <div className="header-top-strip">
          <div className="container header-strip-inner">
            <button className="delivery-trigger" type="button" onClick={() => { setPincodeInput(pincode); setLocationOpen(true) }}>
              <MapPin size={15} aria-hidden="true" /> Deliver to <strong>{pincode || 'pincode'}</strong>
            </button>
            <p>Thoughtful essentials, delivered with care</p>
          </div>
        </div>
        <div className="container navbar-main">
          <button className="icon-button mobile-menu-trigger" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          <Link className="brand" to="/">NEXORA</Link>
          <form className="header-search" role="search" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="header-category">Search category</label>
            <select id="header-category" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Search by category">
              <option value="">All</option>
              {flatCategories.map((item) => <option key={item._id} value={item.slug}>{item.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="header-keyword">Search products</label>
            <input id="header-keyword" value={keyword} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 140)} onKeyDown={handleSearchKeyDown} onChange={(event) => { setKeyword(event.target.value); setSuggestionIndex(-1); setSuggestionsOpen(true) }} placeholder="Search products, brands and more" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls="header-search-suggestions" />
            <button type="submit" aria-label="Search"><Search size={19} /></button>
            {suggestionsOpen && (keyword.trim().length >= 2 || recentSearches.length > 0) && <div className="search-suggestions" id="header-search-suggestions" role="listbox">
              {keyword.trim().length >= 2 ? <>
                {suggestionItems.map((suggestion, index) => <button type="button" role="option" aria-selected={index === suggestionIndex} className={index === suggestionIndex ? 'is-active' : ''} key={`${suggestion.type}-${suggestion.label}`} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(suggestion)}>
                  {suggestion.type === 'product' ? <><img src={suggestion.item.images?.[0]} alt="" /><span>{suggestion.label}</span><small>Product</small></> : <><Search size={15} /><span>{suggestion.label}</span><small>{suggestion.type}</small></>}
                </button>)}
                {!suggestionItems.length && <p className="suggestion-empty">No quick matches. Press Enter to search.</p>}
                <button className="suggestion-submit" type="submit">Search all results for “{keyword.trim()}”</button>
              </> : <>
                <div className="recent-search-heading"><span>Recent searches</span><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setRecentSearches([]); localStorage.removeItem('nexoraRecentSearches') }}>Clear</button></div>
                {recentSearches.map((term, index) => <button type="button" role="option" aria-selected={index === suggestionIndex} className={index === suggestionIndex ? 'is-active' : ''} key={term} onMouseDown={(event) => event.preventDefault()} onClick={() => { setKeyword(term); rememberSearch(term); navigate(`/search?q=${encodeURIComponent(term)}`); setSuggestionsOpen(false) }}><Search size={15} /><span>{term}</span></button>)}
              </>}
            </div>}
          </form>
          <div className="header-actions">
            <Link className="header-icon-link wishlist-link" to="/wishlist" aria-label={`Wishlist, ${counts.wishlist} items`}>
              <Heart size={21} /><span>Wishlist</span><Badge count={counts.wishlist} />
            </Link>
            <Link className="header-icon-link cart-link" to="/cart" aria-label={`Cart, ${counts.cart} items`}>
              <ShoppingBag size={21} /><span>Cart</span><Badge count={counts.cart} />
            </Link>
            <button className="icon-button theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <details className="account-menu">
              <summary aria-label="Account menu"><UserRound size={20} /><ChevronDown size={14} /></summary>
              <div className="account-dropdown">
                {user ? <><p className="account-name">{user.name}</p><Link to="/orders">Orders</Link><Link to="/wishlist">Wishlist</Link><Link to="/account">Account</Link>{user.role === 'admin' && <Link to="/admin">Admin</Link>}<button type="button" onClick={handleLogout}>Logout</button></> : <><Link to="/login">Log in</Link><Link to="/register">Create account</Link></>}
              </div>
            </details>
            {!user && <Link className="button button-small join-button" to="/register">Join NEXORA</Link>}
          </div>
        </div>
        <nav className="secondary-nav" aria-label="Shopping categories">
          <div className="container secondary-nav-inner">
            <button className="all-categories-button" type="button" onClick={showCategories}><Grid2X2 size={16} /> All</button>
            <NavLink to="/shop">Shop</NavLink>
            <NavLink to="/shop?sort=rating"><span className="nav-icon-label"><TrendingIcon />Trending</span></NavLink>
            <NavLink to="/shop?minDiscount=10"><span className="nav-icon-label"><Tag size={15} />Deals</span></NavLink>
            {categoryLinks.map((item) => <NavLink key={item._id} to={`/c/${item.slug}`}>{item.name}</NavLink>)}
          </div>
        </nav>
      </header>

      <Drawer open={categoryOpen} title="Shop by category" onClose={() => setCategoryOpen(false)}>
        {categoryError ? <div className="drawer-state"><p role="alert">{categoryError}</p><Button type="button" onClick={() => { setCategoryError(''); loadCategories() }}>Retry</Button></div> : categories.length ? <CategoryTree categories={categories} onSelect={chooseCategory} /> : <p className="status-message">Loading categories…</p>}
      </Drawer>
      <Drawer open={mobileOpen} title="NEXORA" onClose={() => setMobileOpen(false)}>
        <div className="mobile-drawer-links"><Link to="/" onClick={() => setMobileOpen(false)}>Home</Link><button type="button" onClick={showCategories}>Categories</button><Link to="/shop" onClick={() => setMobileOpen(false)}>Shop</Link><Link to="/shop?sort=rating" onClick={() => setMobileOpen(false)}>Trending</Link><Link to="/shop?minDiscount=10" onClick={() => setMobileOpen(false)}>Deals</Link>{user ? <button type="button" onClick={handleLogout}>Logout</button> : <><Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link><Link to="/register" onClick={() => setMobileOpen(false)}>Create account</Link></>}</div>
      </Drawer>
      <Modal open={locationOpen} title="Set delivery location" onClose={() => setLocationOpen(false)}>
        <form className="pincode-form" onSubmit={savePincode}><label htmlFor="pincode-input">6-digit pincode</label><input id="pincode-input" inputMode="numeric" autoComplete="postal-code" maxLength="6" value={pincodeInput} onChange={(event) => setPincodeInput(event.target.value.replace(/\D/g, ''))} placeholder="Enter pincode" /><Button type="submit">Save location</Button></form>
      </Modal>
      <nav className="mobile-tab-bar" aria-label="Quick navigation">
        <NavLink to="/" end><Home size={19} /><span>Home</span></NavLink>
        <button type="button" onClick={showCategories}><Grid2X2 size={19} /><span>Categories</span></button>
        <button type="button" onClick={focusSearch}><Search size={19} /><span>Search</span></button>
        <NavLink to="/cart"><span className="mobile-tab-icon"><ShoppingBag size={19} /><Badge count={counts.cart} /></span><span>Cart</span></NavLink>
        <NavLink to={user ? '/account' : '/login'}><UserRound size={19} /><span>Account</span></NavLink>
      </nav>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  )
}

function TrendingIcon() {
  return <span aria-hidden="true" className="trending-glyph">↗</span>
}

export default Navbar
