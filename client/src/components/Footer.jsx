import { useState } from 'react'
import { ArrowUp, Play, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Toast } from './ui'

function Footer() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleNewsletter = (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage('Enter a valid email address.')
      return
    }
    setMessage('Newsletter signup is not connected yet.')
  }

  return (
    <footer className="site-footer">
      <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        Back to top <ArrowUp size={16} aria-hidden="true" />
      </button>
      <div className="container footer-main">
        <section className="footer-brand-column">
          <Link className="brand" to="/">NEXORA</Link>
          <p className="footer-copy">Thoughtful goods for the way you live, work, and move.</p>
          <div className="social-links" aria-label="Social links">
            <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer"><Share2 size={19} /></a>
            <a href="https://www.youtube.com/" aria-label="YouTube" target="_blank" rel="noreferrer"><Play size={19} /></a>
          </div>
        </section>
        <nav className="footer-link-column" aria-label="Shop links">
          <h2>Shop</h2><Link to="/shop">All products</Link><Link to="/shop?sort=rating">Trending</Link><Link to="/shop?minDiscount=10">Deals</Link>
        </nav>
        <nav className="footer-link-column" aria-label="Customer links">
          <h2>Help</h2><Link to="/account">Account</Link><Link to="/orders">Orders</Link><Link to="/account">Contact</Link>
        </nav>
        <section className="footer-newsletter">
          <h2>Stay in the loop</h2>
          <p className="footer-copy">New arrivals and considered edits, occasionally.</p>
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required />
            <Button type="submit" aria-label="Subscribe to newsletter">Join</Button>
          </form>
        </section>
      </div>
      <div className="container footer-bottom">
        <p className="footer-copy">© 2026 NEXORA. Built in Phase 1.</p>
        <div className="payment-methods" aria-label="Accepted payment methods"><span>VISA</span><span>Mastercard</span><span>UPI</span><span>RuPay</span></div>
      </div>
      <Toast message={message} onClose={() => setMessage('')} />
    </footer>
  )
}

export default Footer
