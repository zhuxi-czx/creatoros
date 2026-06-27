import api from './api'

export interface Category {
  id: string
  name: string
  intro?: string
  coverUrl?: string
  icon?: string
  order: number
  _count?: { events: number }
}

export const getCategories = (): Promise<Category[]> =>
  api.get('/admin/categories') as any

export const createCategory = (data: Partial<Category>): Promise<Category> =>
  api.post('/admin/categories', data) as any

export const updateCategory = (id: string, data: Partial<Category>): Promise<Category> =>
  api.put(`/admin/categories/${id}`, data) as any

export const deleteCategory = (id: string): Promise<void> =>
  api.delete(`/admin/categories/${id}`) as any
