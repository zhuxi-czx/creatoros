import { request } from './api'

export type CouponStatus = 'UNUSED' | 'USED' | 'EXPIRED'

export interface Coupon {
  id: string
  type: string
  title: string
  amount: number // 分
  status: CouponStatus
  expireAt: string
  usedAt?: string | null
}

export const getCoupons = () => request<Coupon[]>('/coupons')
export const useCoupon = (id: string) => request(`/coupons/${id}/use`, 'POST')
export const deleteCoupon = (id: string) => request(`/coupons/${id}`, 'DELETE')
