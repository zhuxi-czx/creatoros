import Taro from '@tarojs/taro'
import { useAuthStore } from '../stores/useAuthStore'

// 生产域名（HTTPS，nginx 443 反代到 4000）。小程序合法域名即此。
const SERVER_HOST = 'https://creatorbar.cn'
const BASE_URL = `${SERVER_HOST}/api`

/** 图片统一存相对路径 /uploads/...，拼到 SERVER_HOST。 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('/uploads/')) {
    return `${SERVER_HOST}${url}`
  }
  return url
}

// 分享卡片专用图：微信分享不渲染 WebP，统一走后端按需转 JPG 的端点
export function shareCoverUrl(url: string | undefined): string {
  if (!url) return ''
  const base = (url.split('/').pop() || '').replace(/\.\w+$/, '')
  if (!base) return ''
  return `${SERVER_HOST}/api/upload/share-jpg/${base}`
}

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
          // token 失效：清理 storage + 内存 store，避免「假登录」卡死
          Taro.removeStorageSync('h5_token')
          Taro.removeStorageSync('user')
          try { useAuthStore.getState().logout() } catch { /* 忽略 */ }
          reject(new Error('登录已过期，请重新登录'))
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

export interface UploadResult {
  url: string
  thumbUrl: string
}

/** 上传图片（如微信头像临时文件）。需在微信后台配置 uploadFile 合法域名。 */
export function uploadImage(filePath: string, type = 'default'): Promise<UploadResult> {
  const token = Taro.getStorageSync('h5_token')
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/upload/image?type=${type}`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data) as UploadResult)
          } catch {
            reject(new Error('上传响应解析失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败')),
    })
  })
}
