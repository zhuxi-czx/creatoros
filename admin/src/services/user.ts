import api from './api'

export interface User {
  id: number
  name: string
  bio?: string
  tags?: string[]
  signupCount?: number
  createdAt?: string
  avatarUrl?: string
}

export async function getUsers(): Promise<User[]> {
  return api.get('/users') as Promise<User[]>
}
