import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Request interceptor — attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(
      new Error(error.response?.data?.message || error.message || 'Request failed')
    )
  }
)

export default api
