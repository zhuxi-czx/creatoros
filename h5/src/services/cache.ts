// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache(key: string, data: any, ttlMs: number = 60000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs })
}
