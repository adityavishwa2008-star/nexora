import { Link, NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-header">
      <div className="container navbar">
        <Link className="brand" to="/">
          NEXORA
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/cart">Cart</NavLink>
        </nav>
        <div className="auth-links">
          <Link to="/login">Log in</Link>
          <Link className="button button-small" to="/register">Join NEXORA</Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
