import Taro from '@tarojs/taro'

const BASE_URL = 'http://121.196.149.0:4000/api'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: Record<string, unknown>
}

interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data } = options
  const token = Taro.getStorageSync('token')

  const header: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('user')
          reject(new Error('Unauthorized'))
        } else {
          reject(new Error((res.data as { message?: string })?.message || 'Request failed'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || 'Network error'))
      }
    })
  })
}
