import { request } from './api'

export interface Event {
  id: number
  title: string
  description: string
  startTime: string
  endTime?: string
  location: string
  hostName: string
  hostId?: number
  status: 'upcoming' | 'ongoing' | 'ended'
  signupCount: number
  capacity?: number
  hasSignedUp?: boolean
  coverColor?: string
  tags?: string[]
  participants?: Array<{ id: number; name: string; avatarUrl?: string }>
}

interface EventListParams {
  status?: string
  limit?: number
  offset?: number
  tag?: string
}

export async function getEvents(params: EventListParams = {}): Promise<Event[]> {
  const query = new URLSearchParams()
  if (params.status) query.append('status', params.status)
  if (params.limit) query.append('limit', String(params.limit))
  if (params.offset) query.append('offset', String(params.offset))
  if (params.tag) query.append('tag', params.tag)

  const queryStr = query.toString()
  return request<Event[]>({ url: `/events${queryStr ? `?${queryStr}` : ''}` })
}

export async function getFeatured(): Promise<Event[]> {
  return request<Event[]>({ url: '/events?featured=true&limit=5' })
}

export async function getEventDetail(id: number): Promise<Event> {
  return request<Event>({ url: `/events/${id}` })
}

export async function signup(eventId: number): Promise<void> {
  return request<void>({
    url: `/events/${eventId}/signup`,
    method: 'POST'
  })
}

export async function cancelSignup(eventId: number): Promise<void> {
  return request<void>({
    url: `/events/${eventId}/signup`,
    method: 'DELETE'
  })
}
