import { request } from './api'

export interface MembershipInfo {
  isMember: boolean
  expireAt?: string
  guestFreeLeft?: number
  gatheringFreeLeft?: number
}

export interface PayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export const getMembership = () => request<MembershipInfo>('/membership')
export const purchaseMembership = () =>
  request<{ orderId: string; payParams: PayParams }>('/membership/purchase', 'POST')
