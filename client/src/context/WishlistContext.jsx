import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from './auth'

const WishlistContext = createContext(null)
const empty = { products: [] }

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState(empty)
  const [error, setError] = useState('')
  const loadWishlist = async () => { if (!user) { setWishlist(empty); return } try { setWishlist((await api.get('/wishlist')).data); setError('') } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load wishlist.') } }
  useEffect(() => { loadWishlist() }, [user])
  const mutate = async (request) => { try { const { data } = await request; setWishlist(data); setError(''); return data } catch (requestError) { const message = requestError.response?.data?.message || 'Wishlist update failed.'; setError(message); throw new Error(message) } }
  const has = (id) => wishlist.products.some((product) => (product._id || product) === id)
  const toggle = (id) => has(id) ? mutate(api.delete(`/wishlist/${id}`)) : mutate(api.post(`/wishlist/${id}`))
  const remove = (id) => mutate(api.delete(`/wishlist/${id}`))
  return <WishlistContext.Provider value={{ wishlist, error, count: wishlist.products.length, refresh: loadWishlist, has, toggle, remove }}>{children}</WishlistContext.Provider>
}

export function useWishlist() { const context = useContext(WishlistContext); if (!context) throw new Error('useWishlist must be used within WishlistProvider'); return context }