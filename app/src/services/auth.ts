import Taro from '@tarojs/taro'
import { request } from './api'

export interface User {
  id: number
  name: string
  bio?: string
  tags?: string[]
  openid?: string
  avatarUrl?: string
}

interface LoginResponse {
  token: string
  user: User
}

export async function wxLogin(): Promise<LoginResponse> {
  // Step 1: Get WeChat code
  const loginRes = await new Promise<Taro.login.SuccessCallbackResult>((resolve, reject) => {
    Taro.login({
      success: resolve,
      fail: reject
    })
  })

  // Step 2: Exchange code for token
  const response = await request<LoginResponse>({
    url: '/auth/wx-login',
    method: 'POST',
    data: { code: loginRes.code }
  })

  // Step 3: Store credentials
  Taro.setStorageSync('token', response.token)
  Taro.setStorageSync('user', response.user)

  return response
}

export async function getProfile(): Promise<User> {
  return request<User>({ url: '/auth/profile' })
}
