import { request } from './api'

export interface MyOrder {
  id: string
  outTradeNo: string
  type: 'EVENT' | 'MEMBERSHIP'
  title: string
  eventId?: string | null
  amount: number
  status: 'PENDING' | 'PAID' | 'CLOSED' | 'REFUNDING' | 'REFUNDED'
  paidAt?: string | null
  createdAt: string
}

/** 订单中心页：当前用户的订单列表 */
export const getMyOrders = (): Promise<MyOrder[]> =>
  request<MyOrder[]>('/orders/mine')
