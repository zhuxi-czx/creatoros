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

export const getProfile = (): Promise<User> =>
  request<User>('/auth/profile')

export const updateProfile = (data: Partial<User>): Promise<User> =>
  request<User>('/users/profile', 'PUT', data)

export const getMySignups = (): Promise<SignupRecord[]> =>
  request<SignupRecord[]>('/users/signups')
