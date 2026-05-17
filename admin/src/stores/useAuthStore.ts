import type { AdminUser } from '../services/auth'

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuth(token: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
