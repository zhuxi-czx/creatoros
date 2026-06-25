import { request } from './api'

export interface CreatorCard {
  id: string
  nickname?: string
  avatarUrl?: string
  title?: string | null
  tagline?: string | null
  coverUrl?: string | null
  tags?: string[]
  contentCount?: number
}

export interface ContentBrief {
  id: string
  title: string
  coverUrl?: string | null
  publishedAt?: string | null
}

export interface CreatorDetail {
  id: string
  nickname?: string
  avatarUrl?: string
  title?: string | null
  tagline?: string | null
  intro?: string | null
  coverUrl?: string | null
  tags?: string[]
  contents: ContentBrief[]
}

export interface ContentListItem {
  id: string
  title: string
  coverUrl?: string | null
  publishedAt?: string | null
  creator: { id: string; nickname?: string; title?: string | null }
}

export interface ContentDetail {
  id: string
  title: string
  body: string
  coverUrl?: string | null
  publishedAt?: string | null
  creator: { id: string; nickname?: string; avatarUrl?: string; title?: string | null; isActive?: boolean }
}

export const getCreators = () => request<CreatorCard[]>('/creators')
export const getCreator = (id: string) => request<CreatorDetail>(`/creators/${id}`)
export const getContents = () => request<ContentListItem[]>('/contents')
export const getContent = (id: string) => request<ContentDetail>(`/contents/${id}`)
