import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Venue from './pages/Venue'
import Discover from './pages/Discover'
import { getBanners } from './services/banner'
import { getVenues } from './services/venue'
import { getFeaturedEvents, getEvents } from './services/event'
import { setCache } from './services/cache'

// Preload all data on app start
function usePreload() {
  useEffect(() => {
    getBanners().then(d => setCache('banners', d, 120000)).catch(() => {})
    getVenues().then(d => setCache('venues', d, 120000)).catch(() => {})
    getFeaturedEvents().then(d => setCache('featured', d, 60000)).catch(() => {})
    getEvents(1, 20).then(res => {
      const data = Array.isArray(res) ? res : (res as any).data || []
      setCache('events', data, 60000)
    }).catch(() => {})
  }, [])
}

export default function App() {
  usePreload()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/venue/:id" element={<Venue />} />
      </Routes>
    </BrowserRouter>
  )
}
