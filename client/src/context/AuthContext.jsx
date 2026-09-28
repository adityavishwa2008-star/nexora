import { useState } from 'react'
import api from '../api/axios'
import { AuthContext } from './auth'

function restoreUser() {
  try {
    const user = JSON.parse(localStorage.getItem('nexoraUser') || 'null')
    if (user?.token) {
      localStorage.setItem('nexoraToken', user.token)
      return user
    }
  } catch {
    localStorage.removeItem('nexoraUser')
  }

  localStorage.removeItem('nexoraToken')
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(restoreUser)

  const saveSession = (userData) => {
    localStorage.setItem('nexoraUser', JSON.stringify(userData))
    localStorage.setItem('nexoraToken', userData.token)
    setUser(userData)
    return userData
  }

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details)
    return saveSession(data)
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    return saveSession(data)
  }

  const logout = () => {
    localStorage.removeItem('nexoraUser')
    localStorage.removeItem('nexoraToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
