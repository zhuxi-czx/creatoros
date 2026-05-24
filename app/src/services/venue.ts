import { request } from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  description?: string
  coverUrl?: string
  _count?: { events: number }
}

export const getVenues = (): Promise<Venue[]> =>
  request<Venue[]>('/venues')

export const getVenueDetail = (id: string): Promise<Venue> =>
  request<Venue>(`/venues/${id}`)

export const getVenueEvents = (id: string): Promise<any> =>
  request<any>(`/venues/${id}/events`)
