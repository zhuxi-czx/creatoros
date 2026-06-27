import { request } from './api'

export interface Venue {
  id: string
  name: string
  address: string
  city?: string
  description?: string
  coverUrl?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  coverUrl?: string
  coverColor?: string
  imageUrls?: string[]
  autoplay?: boolean
  interval?: number
  highlights?: string
  schedule?: string
  notes?: string
  hostName?: string
  hostAvatar?: string
  price?: number
  priceNote?: string
  maxCapacity?: number
  maxParticipants?: number
  currentParticipants?: number
  featured?: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'FULL' | 'ONGOING' | 'ENDED' | 'CANCELLED'
  tags?: string[]
  isSignedUp?: boolean
  venue?: Venue
  _count?: { signups: number }
  signups?: Array<{ user: { id: string; avatarUrl?: string } }>
  categoryId?: string
  isPlanfExclusive?: boolean
  isGuestShare?: boolean
  guestName?: string
  category?: { id: string; name: string; icon?: string }
  pricing?: Pricing
}

export interface Pricing {
  originalPrice: number
  isMember: boolean
  isFreeEvent: boolean
  memberPrice: number
  finalPrice: number
  freeType: 'GUEST_FREE' | 'GATHERING_FREE' | null
  freeAvailable: boolean
}

export interface EventsResponse {
  data: Event[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface Participant {
  id: string
  nickname?: string
  avatarUrl?: string
  city?: string
}

export const getEvents = (page = 1, limit = 20, keyword?: string, userId?: string): Promise<EventsResponse> =>
  request<EventsResponse>(`/events?page=${page}&limit=${limit}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}${userId ? `&userId=${userId}` : ''}`)

export const getFeaturedEvents = (): Promise<Event[]> =>
  request<Event[]>('/events/featured')

export const getEventDetail = (id: string, userId?: string): Promise<Event> =>
  request<Event>(`/events/${id}${userId ? `?userId=${userId}` : ''}`)

export const getEventSignups = (id: string): Promise<Participant[]> =>
  request<Participant[]>(`/events/${id}/signups`)

export const signup = (eventId: string): Promise<void> =>
  request<void>(`/events/${eventId}/signup`, 'POST')

export interface CancelResult {
  success: boolean
  refunded: boolean // 是否触发了原路退款（付费报名）
  refundStatus?: string
}

export const cancelSignup = (eventId: string): Promise<CancelResult> =>
  request<CancelResult>(`/events/${eventId}/signup`, 'DELETE')

// ===== 付费报名（微信支付）=====

export interface PayParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export interface CheckoutResponse {
  orderId?: string
  payParams?: PayParams
  free?: boolean // 会员免费名额直接确认报名
}

export interface OrderStatus {
  id: string
  status: string
  amount: number
  paid: boolean
  signupStatus: string | null
}

/** 付费活动下单，返回 wx.requestPayment 所需参数。 */
export const checkout = (eventId: string): Promise<CheckoutResponse> =>
  request<CheckoutResponse>(`/events/${eventId}/checkout`, 'POST')

/** 查询订单/报名状态（支付后轮询）。 */
export const getOrder = (orderId: string): Promise<OrderStatus> =>
  request<OrderStatus>(`/orders/${orderId}`)
