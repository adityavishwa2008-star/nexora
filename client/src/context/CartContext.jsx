import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from './auth'

const CartContext = createContext(null)
const empty = { items: [] }

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCart = async () => {
    if (!user) { setCart(empty); return }
    setLoading(true)
    try { setCart((await api.get('/cart')).data); setError('') } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load cart.') } finally { setLoading(false) }
  }
  useEffect(() => { loadCart() }, [user])

  const mutate = async (request) => { try { const { data } = await request; setCart(data); setError(''); return data } catch (requestError) { const message = requestError.response?.data?.message || 'Cart update failed.'; setError(message); throw new Error(message) } }
  const add = (product, qty = 1) => mutate(api.post('/cart', { product: product._id, qty }))
  const setQty = (productId, qty) => mutate(api.put(`/cart/${productId}`, { qty }))
  const remove = (productId) => mutate(api.delete(`/cart/${productId}`))
  const clear = () => mutate(api.delete('/cart'))
  const count = cart.items.reduce((sum, item) => sum + item.qty, 0)
  return <CartContext.Provider value={{ cart, loading, error, count, refresh: loadCart, add, setQty, remove, clear }}>{children}</CartContext.Provider>
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within CartProvider'); return context }