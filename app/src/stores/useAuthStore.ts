import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '../services/auth'

interface AuthState {
  token: string | null
  user: User | null
  initialized: boolean
  init: () => void
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  initialized: false,

  init: () => {
    if (get().initialized) return
    try {
      const token = Taro.getStorageSync('h5_token') || null
      const user = Taro.getStorageSync('user') || null
      set({ token, user, initialized: true })
    } catch {
      set({ initialized: true })
    }
  },

  login: (token: string, user: User) => {
    Taro.setStorageSync('h5_token', token)
    Taro.setStorageSync('user', user)
    set({ token, user })
  },

  logout: () => {
    Taro.removeStorageSync('h5_token')
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
