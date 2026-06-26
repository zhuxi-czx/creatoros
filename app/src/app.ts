import { useLaunch } from '@tarojs/taro'
import './app.scss'
import { useAuthStore } from './stores/useAuthStore'

function App({ children }: { children: React.ReactNode }) {
  // 冷启动从 storage 回填登录态，避免老用户重开显示「未登录」
  useLaunch(() => { useAuthStore.getState().init() })
  return children
}

export default App
