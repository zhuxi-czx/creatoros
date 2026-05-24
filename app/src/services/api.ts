import Taro from '@tarojs/taro'

const BASE_URL = 'http://121.196.149.0:4000/api'

export async function request<T = any>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
  const token = Taro.getStorageSync('h5_token')
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) header['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          Taro.removeStorageSync('h5_token')
          reject(new Error('Unauthorized'))
        } else {
          reject(new Error((res.data as any)?.message || 'Request failed'))
        }
      },
      fail: (err) => {
        console.error('[API] Request failed:', url, err.errMsg)
        reject(new Error(err.errMsg || 'Network error'))
      }
    })
  })
}
