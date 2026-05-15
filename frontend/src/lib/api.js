import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — clear auth and redirect only for API calls that require auth
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const errorCode = err.response?.data?.error
      // Only logout on actual token failures, not wrong-password errors from account settings
      const isCredentialError = errorCode === 'WRONG_PASSWORD' || errorCode === 'INVALID_CREDENTIALS'
      // Only logout on protected routes, not public ones
      const publicRoutes = ['/auth/', '/products', '/content', '/rfq']
      const isPublic = publicRoutes.some((r) => url.includes(r))
      if (!isPublic && !isCredentialError) {
        useAuthStore.getState().clearAuth()
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${redirect}`
      }
    }
    return Promise.reject(err)
  }
)

export default api
