import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './stores/useAuthStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const { token, login } = useAuthStore()

  useEffect(() => {
    // Auto login on app launch if no token stored
    if (!token) {
      const storedToken = Taro.getStorageSync('token')
      const storedUser = Taro.getStorageSync('user')
      if (storedToken && storedUser) {
        login(storedToken, storedUser)
      }
    }
  }, [])

  return children
}

export default App
