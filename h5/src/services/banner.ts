import api from './api'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
}

export const getBanners = async (): Promise<Banner[]> => {
  const res = await api.get('/banners')
  return res as unknown as Banner[]
}
