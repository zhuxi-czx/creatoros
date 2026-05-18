import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Venue from './pages/Venue'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/venue/:id" element={<Venue />} />
      </Routes>
    </BrowserRouter>
  )
}
