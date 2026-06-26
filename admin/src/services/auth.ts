import api from './api'

export interface AdminUser {
  id: string
  nickname: string
  role: string
}

interface LoginResponse {
  accessToken: string
  user: AdminUser
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  return api.post('/auth/admin-login', { username, password }) as any
}
