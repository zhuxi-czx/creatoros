import { useEffect } from 'react'
import { useAuthStore } from './stores/useAuthStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [])

  return children
}

export default App
