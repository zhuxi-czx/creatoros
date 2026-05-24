import api from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  description?: string
  coverUrl?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
  _count?: { events: number }
}

export const getVenues = async (): Promise<Venue[]> => {
  const res = await api.get('/venues')
  return res as unknown as Venue[]
}
