import { request } from './api'
import type { User } from './auth'

export interface SignupRecord {
  id: string
  eventId: string
  event: {
    id: string
    title: string
    date?: string
    startTime?: string
    venue?: {
      name: string
      city?: string
    }
    _count?: { signups: number }
  }
  createdAt: string
}

export interface UpdateProfileInput {
  nickname?: string
  avatarUrl?: string
  city?: string
  bio?: string
  gender?: string
  mbti?: string
  zodiac?: string
  generation?: string
  tags?: string[]
  phone?: string
}

export const getProfile = (): Promise<User> =>
  request<User>('/auth/profile')

export const updateProfile = (data: UpdateProfileInput): Promise<User> =>
  request<User>('/users/profile', 'PUT', data)

/** 状态选择弹窗：保存状态（忽略传空数组），后端会标记已弹过 */
export const setStatuses = (statuses: string[]): Promise<User> =>
  request<User>('/users/statuses', 'PUT', { statuses })

export const getMySignups = (): Promise<SignupRecord[]> =>
  request<SignupRecord[]>('/users/signups')
