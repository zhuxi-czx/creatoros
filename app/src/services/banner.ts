import { request } from './api'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
}

export const getBanners = (): Promise<Banner[]> =>
  request<Banner[]>('/banners')
