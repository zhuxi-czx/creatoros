import api from './api'

export interface Event {
  id: string
  title: string
  description?: string
  coverUrl?: string
  date: string
  venueId: string
  hostName?: string
  maxCapacity: number
  price: number
  status: string
  featured: boolean
  createdAt: string
  updatedAt: string
  venue?: { id: string; name: string; city: string }
  _count?: { signups: number }
}

export interface EventFormData {
  title: string
  description?: string
  coverUrl?: string
  date: string
  venueId: string
  hostName?: string
  maxCapacity: number
  price?: number
  status?: string
  featured?: boolean
}

interface PaginatedResponse {
  data: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getEvents(page = 1, limit = 100): Promise<PaginatedResponse> {
  return api.get(`/admin/events?page=${page}&limit=${limit}`) as any
}

export async function getEventDetail(id: string): Promise<Event> {
  return api.get(`/admin/events/${id}`) as any
}

export async function createEvent(data: EventFormData): Promise<Event> {
  return api.post('/admin/events', data) as any
}

export async function updateEvent(id: string, data: Partial<EventFormData>): Promise<Event> {
  return api.put(`/admin/events/${id}`, data) as any
}

export async function updateEventStatus(id: string, status: string): Promise<Event> {
  return api.put(`/admin/events/${id}/status`, { status }) as any
}

export async function getStats(): Promise<any> {
  return api.get('/admin/stats') as any
}

export async function getVenues(): Promise<any[]> {
  return api.get('/admin/venues') as any
}

export async function createVenue(data: any): Promise<any> {
  return api.post('/admin/venues', data) as any
}

export async function getEventSignups(id: string, page = 1, limit = 50): Promise<any> {
  return api.get(`/admin/events/${id}/signups?page=${page}&limit=${limit}`) as any
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as any
}
