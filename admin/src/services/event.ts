import api from './api'

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
  coverColor?: string
  tags?: string[]
  featured?: boolean
}

export interface EventFormData {
  title: string
  description: string
  startTime?: string
  endTime?: string
  location: string
  hostName: string
  capacity?: number
  coverColor?: string
  tags?: string[]
}

export async function getEvents(): Promise<Event[]> {
  return api.get('/events?limit=100') as Promise<Event[]>
}

export async function getEventDetail(id: number): Promise<Event> {
  return api.get(`/events/${id}`) as Promise<Event>
}

export async function createEvent(data: EventFormData): Promise<Event> {
  return api.post('/events', data) as Promise<Event>
}

export async function updateEvent(id: number, data: Partial<EventFormData>): Promise<Event> {
  return api.patch(`/events/${id}`, data) as Promise<Event>
}

export async function deleteEvent(id: number): Promise<void> {
  return api.delete(`/events/${id}`) as Promise<void>
}
