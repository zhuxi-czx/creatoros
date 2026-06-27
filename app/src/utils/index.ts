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

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 活动日期人性化：今天/明天/后天；未来 7 天内加（周几）；今年省略年份；跨年显示完整年月日。
 */
export function formatEventDate(dateStr: string | number | undefined): string {
  if (!dateStr) return '时间待定'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  const m = date.getMonth() + 1
  const d = date.getDate()

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === 2) return '后天'
  if (diffDays >= 3 && diffDays <= 7) {
    return `${m}月${d}日（周${WEEK_CN[date.getDay()]}）`
  }
  if (date.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${date.getFullYear()}年${m}月${d}日`
}

/** 活动日期(人性化) + 时间 HH:mm，如「今天 19:00」「6月28日（周五） 19:00」 */
export function formatEventDateTime(dateStr: string | number | undefined): string {
  if (!dateStr) return '时间待定'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${formatEventDate(dateStr)} ${hh}:${mm}`
}
