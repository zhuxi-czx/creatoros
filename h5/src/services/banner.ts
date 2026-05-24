import api from './api'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
}

export const getBanners = async (): Promise<Banner[]> => {
  const res = await api.get('/banners')
  return res as unknown as Banner[]
}
