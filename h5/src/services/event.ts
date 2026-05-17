import api from './api'

export interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime?: string
  coverUrl?: string
  hostName?: string
  hostAvatar?: string
  price?: number
  maxParticipants?: number
  currentParticipants?: number
  status: 'open' | 'full' | 'ended' | 'cancelled'
  tags?: string[]
}

export interface EventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
}

export const getEvents = (page = 1, limit = 20): Promise<EventsResponse> =>
  api.get('/events', { params: { page, limit } }) as unknown as Promise<EventsResponse>

export const getFeaturedEvents = (): Promise<Event[]> =>
  api.get('/events/featured') as unknown as Promise<Event[]>

export const getEventDetail = (id: string): Promise<Event> =>
  api.get(`/events/${id}`) as unknown as Promise<Event>

export const signup = (eventId: string): Promise<void> =>
  api.post(`/events/${eventId}/signup`) as unknown as Promise<void>

export const cancelSignup = (eventId: string): Promise<void> =>
  api.delete(`/events/${eventId}/signup`) as unknown as Promise<void>
