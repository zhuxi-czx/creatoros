import { request } from './api'
import type { User } from './auth'
import type { Event } from './event'

interface UpdateProfileData {
  name?: string
  bio?: string
  tags?: string[]
  avatarUrl?: string
}

export async function updateProfile(data: UpdateProfileData): Promise<User> {
  return request<User>({
    url: '/users/profile',
    method: 'PATCH',
    data: data as Record<string, unknown>
  })
}

export async function getMySignups(): Promise<Event[]> {
  return request<Event[]>({ url: '/users/my-signups' })
}
