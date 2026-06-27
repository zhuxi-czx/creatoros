import api from './api'

export interface User {
  id: string
  uid?: string
  nickname?: string
  avatarUrl?: string
  city?: string
  bio?: string
  gender?: string
  mbti?: string
  zodiac?: string
  generation?: string
  tags?: string[]
  role: string
  status: string
  createdAt: string
  membership?: { status: string; expireAt: string } | null
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

// 管理员手动开通/续费 PlanF 会员
export async function grantMembership(id: string): Promise<void> {
  return api.post(`/admin/users/${id}/membership`) as any
}
