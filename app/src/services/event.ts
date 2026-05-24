import { request } from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city?: string
  description?: string
  coverUrl?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  coverUrl?: string
  hostName?: string
  hostAvatar?: string
  price?: number
  maxCapacity?: number
  maxParticipants?: number
  currentParticipants?: number
  featured?: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'FULL' | 'ONGOING' | 'ENDED' | 'CANCELLED'
  tags?: string[]
  isSignedUp?: boolean
  venue?: Venue
  _count?: { signups: number }
  signups?: Array<{ user: { id: string; avatarUrl?: string } }>
}

export interface EventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface Participant {
  id: string
  nickname?: string
  avatarUrl?: string
  city?: string
}

export const getEvents = (page = 1, limit = 20): Promise<EventsResponse> =>
  request<EventsResponse>(`/events?page=${page}&limit=${limit}`)

export const getFeaturedEvents = (): Promise<Event[]> =>
  request<Event[]>('/events/featured')

export const getEventDetail = (id: string, userId?: string): Promise<Event> =>
  request<Event>(`/events/${id}${userId ? `?userId=${userId}` : ''}`)

export const getEventSignups = (id: string): Promise<Participant[]> =>
  request<Participant[]>(`/events/${id}/signups`)

export const signup = (eventId: string): Promise<void> =>
  request<void>(`/events/${eventId}/signup`, 'POST')

export const cancelSignup = (eventId: string): Promise<void> =>
  request<void>(`/events/${eventId}/signup`, 'DELETE')
