import api from './api'

export interface UserProfile {
  id: string
  nickname?: string
  name?: string
  avatarUrl?: string
  avatar?: string
  city?: string
  bio?: string
  gender?: string
  mbti?: string
  zodiac?: string
  generation?: string
}

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

export const getProfile = (): Promise<UserProfile> =>
  api.get('/auth/profile') as unknown as Promise<UserProfile>

export const updateProfile = (data: Partial<UserProfile>): Promise<UserProfile> =>
  api.put('/users/profile', data) as unknown as Promise<UserProfile>

export const getMySignups = (): Promise<SignupRecord[]> =>
  api.get('/users/signups') as unknown as Promise<SignupRecord[]>
