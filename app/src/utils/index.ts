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
