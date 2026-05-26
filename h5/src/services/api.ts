import axios from 'axios'

const api = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:4000/api`,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('h5_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Track retry count
  (config as any).__retryCount = (config as any).__retryCount || 0
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config
    if (!config) return Promise.reject(error)

    if (error.response?.status === 401) {
      localStorage.removeItem('h5_token')
      return Promise.reject(error)
    }

    // Auto-retry on network error or timeout (max 2 retries)
    const retryCount = (config as any).__retryCount || 0
    if (retryCount < 2 && (!error.response || error.code === 'ECONNABORTED')) {
      (config as any).__retryCount = retryCount + 1
      await new Promise(r => setTimeout(r, 800 * (retryCount + 1)))
      return api(config)
    }

    return Promise.reject(error)
  }
)

export default api
