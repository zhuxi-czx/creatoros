import api from './api'

export interface ColumnConfigItem {
  id: string
  type: 'FEATURED' | 'PLANF' | 'GUEST'
  title: string
  intro?: string
  icon?: string
  bgUrl?: string
  order?: number
}

export const getColumns = (): Promise<ColumnConfigItem[]> =>
  api.get('/admin/columns') as any

export const updateColumn = (
  type: string,
  data: Partial<ColumnConfigItem>,
): Promise<ColumnConfigItem> => api.put(`/admin/columns/${type}`, data) as any

export const moveColumn = (type: string, dir: 'up' | 'down'): Promise<ColumnConfigItem[]> =>
  api.put(`/admin/columns/${type}/move`, { dir }) as any
