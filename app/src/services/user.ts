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
  gender?: number
  mbti?: string
  zodiac?: string
  generation?: string
  phone?: string
  // Creator 资料（仅 isCreator 生效）
  creatorTitle?: string
  creatorTagline?: string
  creatorIntro?: string
  creatorCoverUrl?: string
  creatorTags?: string[]
}

export const getProfile = (): Promise<User> =>
  request<User>('/auth/profile')

export const updateProfile = (data: UpdateProfileInput): Promise<User> =>
  request<User>('/users/profile', 'PUT', data)

export const getMySignups = (): Promise<SignupRecord[]> =>
  request<SignupRecord[]>('/users/signups')
