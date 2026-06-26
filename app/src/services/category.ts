import { request } from './api'
import type { Event } from './event'

export interface Category {
  id: string
  name: string
  icon?: string
  iconPath?: string
}

export interface CategoryPage {
  id: string
  name: string
  intro?: string
  coverUrl?: string
  icon?: string
  iconPath?: string
  events: Event[]
}

export const getCategories = () => request<Category[]>('/categories')
export const getCategoryPage = (id: string) => request<CategoryPage>(`/categories/${id}`)
