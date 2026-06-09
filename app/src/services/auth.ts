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

/** 手机号快捷登录：wx.login 拿 loginCode + getPhoneNumber 的 phoneCode → 后端换 openId+手机号 */
export async function phoneLogin(phoneCode: string): Promise<LoginResponse> {
  const loginRes = await new Promise<Taro.login.SuccessCallbackResult>((resolve, reject) => {
    Taro.login({ success: resolve, fail: reject })
  })

  const response = await request<LoginResponse>('/auth/phone-login', 'POST', {
    loginCode: loginRes.code,
    phoneCode,
  })

  Taro.setStorageSync('h5_token', response.accessToken)
  Taro.setStorageSync('user', response.user)

  return response
}

export async function getProfile(): Promise<User> {
  return request<User>('/auth/profile')
}
