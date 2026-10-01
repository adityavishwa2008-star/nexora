import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL

if (import.meta.env.PROD && !apiBaseUrl) {
  throw new Error('VITE_API_URL is not configured for this deployment.')
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexoraToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api