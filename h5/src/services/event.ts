import api from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city?: string
  description?: string
  coverUrl?: string
}

export interface Pricing {
  originalPrice: number
  isMember: boolean
  isFreeEvent: boolean
  memberPrice: number
  finalPrice: number
  freeType: 'GUEST_FREE' | null
  freeAvailable: boolean
  memberOnly?: boolean
  canSignup?: boolean
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
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
  hostName?: string
  hostAvatar?: string
  price?: number
  priceNote?: string
  isPlanfExclusive?: boolean
  isGuestShare?: boolean
  guestName?: string
  pricing?: Pricing
  maxCapacity?: number
  maxParticipants?: number
  highlights?: string
  schedule?: string
  notes?: string
  currentParticipants?: number
  status: 'PUBLISHED' | 'DRAFT' | 'FULL' | 'ONGOING' | 'ENDED' | 'CANCELLED'
  tags?: string[]
  isSignedUp?: boolean
  venue?: Venue
  _count?: { signups: number }
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
  api.get('/events', { params: { page, limit } }) as unknown as Promise<EventsResponse>

export const getFeaturedEvents = (): Promise<Event[]> =>
  api.get('/events/featured') as unknown as Promise<Event[]>

export const getEventDetail = (id: string, userId?: string): Promise<Event> =>
  api.get(`/events/${id}`, { params: userId ? { userId } : {} }) as unknown as Promise<Event>

export const getEventSignups = (id: string): Promise<Participant[]> =>
  api.get(`/events/${id}/signups`) as unknown as Promise<Participant[]>

export const signup = (eventId: string): Promise<void> =>
  api.post(`/events/${eventId}/signup`) as unknown as Promise<void>

export const cancelSignup = (eventId: string): Promise<void> =>
  api.delete(`/events/${eventId}/signup`) as unknown as Promise<void>
