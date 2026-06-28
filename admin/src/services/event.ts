import api from './api'

export interface Event {
  id: string
  title: string
  description?: string
  highlights?: string
  schedule?: string
  notes?: string
  coverUrl?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
  date: string
  venueId: string
  hostName?: string
  maxCapacity: number
  price: number
  priceNote?: string
  earlyBirdPrice?: number
  earlyBirdQuota?: number
  status: string
  featured: boolean
  categoryId?: string
  isPlanfExclusive?: boolean
  isGuestShare?: boolean
  guestName?: string
  category?: { id: string; name: string }
  pricing?: any
  createdAt: string
  updatedAt: string
  venue?: { id: string; name: string; city: string }
  _count?: { signups: number }
}

export interface EventFormData {
  title: string
  description?: string
  coverUrl?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
  highlights?: string
  schedule?: string
  notes?: string
  date: string
  venueId: string
  hostName?: string
  maxCapacity: number
  price?: number
  priceNote?: string
  earlyBirdPrice?: number
  earlyBirdQuota?: number
  status?: string
  featured?: boolean
  categoryId?: string
  isPlanfExclusive?: boolean
  isGuestShare?: boolean
  guestName?: string
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

export async function copyEvent(id: string): Promise<Event> {
  return api.post(`/admin/events/${id}/copy`) as any
}

export async function deleteEvent(id: string): Promise<{ success: boolean }> {
  return api.delete(`/admin/events/${id}`) as any
}

export async function getStats(): Promise<any> {
  return api.get('/admin/stats') as any
}

export async function getEventSignups(id: string, page = 1, limit = 50): Promise<any> {
  return api.get(`/admin/events/${id}/signups?page=${page}&limit=${limit}`) as any
}

// 对某条报名退款（原路退回）。返回 { status, refunded }
export async function refundSignup(signupId: string): Promise<{ status: string; refunded: boolean }> {
  return api.post(`/admin/signups/${signupId}/refund`) as any
}

// 后台手动添加报名成员
export async function adminAddSignup(eventId: string, userId: string): Promise<any> {
  return api.post(`/admin/events/${eventId}/signups`, { userId }) as any
}

export async function uploadImage(file: File, type?: string): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const query = type ? `?type=${type}` : ''
  return api.post(`/upload/image${query}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as any
}
