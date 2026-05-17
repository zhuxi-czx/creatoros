/**
 * Format a date string or timestamp into a human-readable format
 */
export function formatDate(dateStr: string | number | undefined, format: 'full' | 'short' | 'time' = 'full'): string {
  if (!dateStr) return '时间待定'

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  switch (format) {
    case 'short':
      return `${month}月${day}日`
    case 'time':
      return `${hours}:${minutes}`
    case 'full':
    default:
      return `${year}年${month}月${day}日 ${hours}:${minutes}`
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate a color from a string (for avatars etc.)
 */
export function stringToColor(str: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899',
    '#10b981', '#3b82f6', '#f59e0b'
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
