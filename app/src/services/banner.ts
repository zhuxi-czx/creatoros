import { request } from './api'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrls: string[]
  autoplay?: boolean
  interval?: number
  sortOrder?: number
  enabled?: boolean
}

export const getBanners = (): Promise<Banner[]> =>
  request<Banner[]>('/banners')
