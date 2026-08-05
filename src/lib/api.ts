import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000, // 60s to handle Railway cold starts
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject Bearer token
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ?? sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 and timeout globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiMessage = error.response?.data?.message
    if (typeof apiMessage === 'string') {
      error.message = apiMessage
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      useAuthStore.getState().clearAuth()
      window.location.href = '/auth/login'
    }
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.')
    }
    return Promise.reject(error)
  },
)
