import Taro from '@tarojs/taro'
import { request } from './api'

export interface User {
  id: string
  nickname?: string
  avatarUrl?: string
  city?: string
  bio?: string
  gender?: number
  mbti?: string
  zodiac?: string
  generation?: string
}

interface LoginResponse {
  accessToken: string
  user: User
}

export async function wxLogin(): Promise<LoginResponse> {
  const loginRes = await new Promise<Taro.login.SuccessCallbackResult>((resolve, reject) => {
    Taro.login({
      success: resolve,
      fail: reject
    })
  })

  const response = await request<LoginResponse>('/auth/wx-login', 'POST', {
    code: loginRes.code
  })

  Taro.setStorageSync('h5_token', response.accessToken)
  Taro.setStorageSync('user', response.user)

  return response
}

export async function getProfile(): Promise<User> {
  return request<User>('/auth/profile')
}
