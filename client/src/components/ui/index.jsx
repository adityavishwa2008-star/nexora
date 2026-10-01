import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function Button({ children, className = '', variant = 'primary', ...props }) {
  return <button className={`button ${variant === 'secondary' ? 'button-secondary' : ''} ${className}`.trim()} {...props}>{children}</button>
}

export function Badge({ children, count, className = '' }) {
  const value = count ?? children
  if (value === undefined || value === null || value === 0 || value === '') return null
  return <span className={`ui-badge ${className}`.trim()}>{value}</span>
}

export function RatingStars({ rating = 0, count }) {
  return <span className="rating-stars" aria-label={`Rated ${Number(rating).toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}>
    <span aria-hidden="true">★</span> {Number(rating).toFixed(1)}{count ? ` (${count})` : ''}
  </span>
}

export function PriceTag({ price, mrp }) {
  const format = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount) || 0)
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  return <span className="price-tag"><strong>{format(price)}</strong>{mrp > price && <><del>{format(mrp)}</del><span className="price-discount">{discount}% off</span></>}</span>
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, label = 'Quantity' }) {
  const change = (next) => onChange(Math.min(max, Math.max(min, next)))
  return <div className="quantity-stepper" aria-label={label}>
    <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => change(value - 1)}>−</button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => change(value + 1)}>+</button>
  </div>
}

export function Modal({ open, title, onClose, children, className = '' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="ui-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
    <section className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
      <header className="ui-modal-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>
}

export function Drawer({ open, title, onClose, children, side = 'left' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
    <aside className={`drawer-panel drawer-${side}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="drawer-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close menu" onClick={onClose}>×</button></header>
      {children}
    </aside>
  </div>
}

export function Toast({ message, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => onClose?.(), duration)
    return () => window.clearTimeout(timer)
  }, [message, onClose, duration])
  if (!message) return null
  return <div className="ui-toast" role="status" aria-live="polite">{message}<button type="button" className="icon-button" aria-label="Dismiss notification" onClick={onClose}>×</button></div>
}

export function ApiErrorState({ message = 'Unable to load this section.', onRetry }) {
  return <div className="empty-state api-error-state" role="alert">
    <p className="form-error">{message}</p>
    {onRetry && <Button type="button" onClick={onRetry}>Retry</Button>}
  </div>
}

export function Skeleton({ className = '', style, ...props }) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" style={style} {...props} />
}

export function ProductGridSkeleton({ count = 3 }) {
  return <div className="product-grid" role="status" aria-label="Loading products">{Array.from({ length: count }, (_, index) => <article className="product-card skeleton-product-card" key={index}>
    <Skeleton className="skeleton-product-image" />
    <div className="product-card-body"><Skeleton className="skeleton-eyebrow" /><Skeleton className="skeleton-title" /><Skeleton className="skeleton-meta" /></div>
  </article>)}</div>
}

export function Breadcrumbs({ items }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>
    {item.to && index < items.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
  </li>)}</ol></nav>
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return <nav className="pagination" aria-label="Product pages">
    <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
    <span>Page {page} of {pages}</span>
    <Button type="button" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
  </nav>
}
