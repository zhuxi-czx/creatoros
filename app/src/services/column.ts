import { request } from './api'
import type { Event } from './event'

export type ColumnType = 'FEATURED' | 'PLANF' | 'GUEST'

export interface ColumnConfig {
  id: string
  type: ColumnType
  title: string
  intro?: string
  icon?: string
  bgUrl?: string
}

export interface ColumnPage {
  config: ColumnConfig | null
  events: Event[]
}

export const getColumns = () => request<ColumnConfig[]>('/columns')
export const getColumnPage = (type: string) => request<ColumnPage>(`/columns/${type}`)
