import { BrowserRouter, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Footer from './components/Footer'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Register = lazy(() => import('./pages/Register'))
const Shop = lazy(() => import('./pages/Shop'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const Admin = lazy(() => import('./pages/Admin'))
const Profile = lazy(() => import('./pages/Profile'))
import './App.css'

function SearchAwareShop() {
  const [searchParams] = useSearchParams()
  return <Shop key={searchParams.toString()} />
}

function RouteEffects() {
  const location = useLocation()
  useEffect(() => { window.scrollTo(0, 0); const title = location.pathname.startsWith('/admin') ? 'Admin | NEXORA' : location.pathname.startsWith('/shop') ? 'Shop | NEXORA' : location.pathname.startsWith('/profile') || location.pathname.startsWith('/account') ? 'Profile | NEXORA' : location.pathname.startsWith('/orders') ? 'Orders | NEXORA' : 'NEXORA' ; document.title = title }, [location.pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider><WishlistProvider><div className="app-shell">
          <RouteEffects />
          <Navbar />
          <main>
            <Suspense fallback={<section className="container page-section"><p className="status-message">Loading NEXORA...</p></section>}><Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<SearchAwareShop />} />
              <Route path="/c/:slug" element={<SearchAwareShop />} />
              <Route path="/collections/:slug" element={<SearchAwareShop />} />
              <Route path="/search" element={<SearchAwareShop />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id/success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes></Suspense>
          </main>
          <Footer />
        </div></WishlistProvider></CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
