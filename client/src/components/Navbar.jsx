import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

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
          {user ? (
            <>
              <span className="user-greeting">{user.name}</span>
              <button className="button button-small" type="button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link className="button button-small" to="/register">Join NEXORA</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
