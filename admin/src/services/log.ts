import api from './api'

export interface SystemLog {
  id: string
  level: 'ERROR' | 'WARN'
  source: string
  message: string
  detail?: string | null
  path?: string | null
  createdAt: string
}

export interface LogPage {
  data: SystemLog[]
  total: number
  page: number
  limit: number
}

export interface DailySummary {
  date: string
  error: number
  warn: number
}

export const getLogs = (
  params: { page?: number; level?: string; source?: string; date?: string } = {},
): Promise<LogPage> => {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.level) q.set('level', params.level)
  if (params.source) q.set('source', params.source)
  if (params.date) q.set('date', params.date)
  return api.get(`/admin/logs?${q.toString()}`) as any
}

export const getLogSummary = (days = 7): Promise<DailySummary[]> =>
  api.get(`/admin/logs/summary?days=${days}`) as any
