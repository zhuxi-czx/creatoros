import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV || window.location.hostname.endsWith('creatorbar.cn')
    ? '/api' // 域名下走同源（nginx 443 代理到 4000）
    : `${window.location.protocol}//${window.location.hostname}:4000/api` // IP:4001 访问
)

const api = axios.create({
  baseURL,
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
      const isLoginRequest = error.config?.url?.includes('/auth/')
      if (!isLoginRequest && window.location.pathname !== '/login') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(
      new Error(error.response?.data?.message || error.message || 'Request failed')
    )
  }
)

/** Resolve image URL: converts relative paths to absolute for display */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('/uploads/')) {
    const serverBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : window.location.hostname.endsWith('creatorbar.cn')
        ? '' // 域名下同源
        : `${window.location.protocol}//${window.location.hostname}:4000`
    return `${serverBase}${url}`
  }
  return url
}

export default api
