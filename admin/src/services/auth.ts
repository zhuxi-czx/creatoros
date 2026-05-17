import api from './api'

export interface AdminUser {
  id: number
  username: string
  role: string
}

interface LoginResponse {
  token: string
  user: AdminUser
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  return api.post('/auth/admin-login', { username, password }) as Promise<LoginResponse>
}

export async function getAdminProfile(): Promise<AdminUser> {
  return api.get('/auth/profile') as Promise<AdminUser>
}
