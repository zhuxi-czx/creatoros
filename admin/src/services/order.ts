import api from './api'

export interface AdminOrder {
  id: string
  outTradeNo: string
  type: 'EVENT' | 'MEMBERSHIP'
  title: string
  amount: number
  status: string
  paidAt?: string | null
  createdAt: string
  user: { id: string; uid?: string; nickname?: string; phone?: string }
}

export const getOrders = (): Promise<{ data: AdminOrder[]; total: number }> =>
  api.get('/admin/orders') as any

export const refundOrder = (id: string): Promise<{ status: string; refunded: boolean }> =>
  api.post(`/admin/orders/${id}/refund`) as any
