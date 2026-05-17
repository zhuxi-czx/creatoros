import axios from 'axios'

const api = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:4000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('h5_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('h5_token')
    }
    return Promise.reject(error)
  }
)

export default api
