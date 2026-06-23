import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EventList from './pages/EventList'
import EventForm from './pages/EventForm'
import EventSignups from './pages/EventSignups'
import BannerList from './pages/BannerList'
import VenueList from './pages/VenueList'
import UserList from './pages/UserList'
import ContentList from './pages/ContentList'
import ContentForm from './pages/ContentForm'
import { getToken } from './stores/useAuthStore'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="events" element={<EventList />} />
        <Route path="events/create" element={<EventForm />} />
        <Route path="events/:id/edit" element={<EventForm />} />
        <Route path="events/:id/signups" element={<EventSignups />} />
        <Route path="banners" element={<BannerList />} />
        <Route path="venues" element={<VenueList />} />
        <Route path="users" element={<UserList />} />
        <Route path="contents" element={<ContentList />} />
        <Route path="contents/create" element={<ContentForm />} />
        <Route path="contents/:id/edit" element={<ContentForm />} />
      </Route>
    </Routes>
  )
}
