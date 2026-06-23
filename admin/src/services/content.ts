import api from './api'

export interface ContentCreator {
  id: string
  nickname?: string
  title?: string | null
}

export interface ContentItem {
  id: string
  title: string
  coverUrl?: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt?: string | null
  createdAt: string
  creator: ContentCreator
}

export interface ContentDetail {
  id: string
  title: string
  body: string
  coverUrl?: string | null
  creatorId: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface UpsertContent {
  title: string
  body: string
  coverUrl?: string
  creatorId: string
  status: 'DRAFT' | 'PUBLISHED'
}

// 供内容表单选择「对谈对象」：复用前台 Creator 列表
export interface CreatorOption {
  id: string
  nickname?: string
  title?: string | null
}

export const getContents = (): Promise<ContentItem[]> =>
  api.get('/admin/contents') as any

export const getContent = (id: string): Promise<ContentDetail> =>
  api.get(`/admin/contents/${id}`) as any

export const createContent = (data: UpsertContent): Promise<ContentDetail> =>
  api.post('/admin/contents', data) as any

export const updateContent = (id: string, data: UpsertContent): Promise<ContentDetail> =>
  api.put(`/admin/contents/${id}`, data) as any

export const deleteContent = (id: string): Promise<{ success: boolean }> =>
  api.delete(`/admin/contents/${id}`) as any

export const getCreatorOptions = (): Promise<CreatorOption[]> =>
  api.get('/creators') as any
