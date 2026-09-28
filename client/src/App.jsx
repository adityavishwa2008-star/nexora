import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import Footer from './components/Footer'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'
import Shop from './pages/Shop'
import './App.css'

function SearchAwareShop() {
  const [searchParams] = useSearchParams()
  return <Shop key={searchParams.toString()} />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<SearchAwareShop />} />
              <Route path="/c/:slug" element={<SearchAwareShop />} />
              <Route path="/collections/:slug" element={<SearchAwareShop />} />
              <Route path="/search" element={<SearchAwareShop />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/account" element={<ProtectedRoute><section className="container page-section"><h1>Account</h1></section></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><section className="container page-section"><p className="eyebrow">Your account</p><h1>Orders</h1><p className="status-message">Order history will appear here after checkout is available.</p></section></ProtectedRoute>} />
              <Route path="/wishlist" element={<section className="container page-section"><p className="eyebrow">Saved for later</p><h1>Wishlist</h1><p className="status-message">Your wishlist is not available yet.</p></section>} />
              <Route path="/cart" element={<section className="container page-section"><p className="eyebrow">Your bag</p><h1>Cart</h1><p className="status-message">Your cart is not available yet.</p></section>} />
              <Route path="/admin" element={<AdminRoute><section className="container page-section"><p className="eyebrow">NEXORA</p><h1>Administration</h1></section></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
