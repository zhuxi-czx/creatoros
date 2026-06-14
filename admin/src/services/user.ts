import api from './api'

export interface User {
  id: string
  uid?: string
  nickname?: string
  avatarUrl?: string
  city?: string
  bio?: string
  gender?: number
  mbti?: string
  zodiac?: string
  generation?: string
  role: string
  status: string
  createdAt: string
  _count?: { signups: number }
}

interface PaginatedResponse {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getUsers(page = 1, limit = 50): Promise<PaginatedResponse> {
  return api.get(`/admin/users?page=${page}&limit=${limit}`) as any
}

export async function updateUserStatus(id: string, status: string): Promise<void> {
  return api.put(`/admin/users/${id}/status`, { status }) as any
}
