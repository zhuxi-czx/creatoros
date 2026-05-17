import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '../services/auth'

interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  login: (token: string, user: User) => {
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('user', user)
    set({ token, user })
  },

  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('user')
    set({ token: null, user: null })
  },

  updateUser: (partialUser: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...partialUser }
      Taro.setStorageSync('user', updatedUser)
      set({ user: updatedUser })
    }
  }
}))
