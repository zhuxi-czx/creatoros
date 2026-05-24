import api from './api'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrls: string[]
  autoplay?: boolean
  interval?: number
  sortOrder: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface BannerFormData {
  title: string
  subtitle?: string
  imageUrls: string[]
  autoplay?: boolean
  interval?: number
  sortOrder?: number
  enabled?: boolean
}

export const getBanners = (): Promise<Banner[]> => api.get('/admin/banners') as any
export const createBanner = (data: BannerFormData): Promise<Banner> => api.post('/admin/banners', data) as any
export const updateBanner = (id: string, data: Partial<BannerFormData>): Promise<Banner> => api.put(`/admin/banners/${id}`, data) as any
export const deleteBanner = (id: string): Promise<void> => api.delete(`/admin/banners/${id}`) as any
