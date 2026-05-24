import api from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  description?: string
  coverUrl?: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
  _count?: { events: number }
}

export interface VenueFormData {
  name: string
  address: string
  city: string
  description?: string
  coverUrl?: string
  latitude?: number
  longitude?: number
}

export const getVenues = (): Promise<Venue[]> => api.get('/admin/venues') as any
export const createVenue = (data: VenueFormData): Promise<Venue> => api.post('/admin/venues', data) as any
export const updateVenue = (id: string, data: Partial<VenueFormData>): Promise<Venue> => api.put(`/admin/venues/${id}`, data) as any
export const deleteVenue = (id: string): Promise<void> => api.delete(`/admin/venues/${id}`) as any
