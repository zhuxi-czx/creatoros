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

/** 时段口语：凌晨/上午/中午/下午/晚上 */
function periodCn(h: number): string {
  return h < 6 ? '凌晨' : h < 12 ? '上午' : h < 13 ? '中午' : h < 18 ? '下午' : '晚上'
}

/**
 * 活动日期(人性化) + 时间。今天/明天/后天带时段口语（今晚 / 今天下午 / 明晚…）；
 * 其余沿用「日期 HH:mm」，如「6月28日（周五） 19:00」「2027年1月1日 08:00」。
 */
export function formatEventDateTime(dateStr: string | number | undefined): string {
  if (!dateStr) return '时间待定'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  const time = `${hh}:${mm}`

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  // 今天/明天/后天：加时段口语；「晚上」特殊简写为 今晚/明晚
  if (diffDays >= 0 && diffDays <= 2) {
    const period = periodCn(date.getHours())
    let word: string
    if (period === '晚上') {
      word = diffDays === 0 ? '今晚' : diffDays === 1 ? '明晚' : '后天晚上'
    } else {
      const dayWord = diffDays === 0 ? '今天' : diffDays === 1 ? '明天' : '后天'
      word = `${dayWord}${period}`
    }
    return `${word} ${time}`
  }

  return `${formatEventDate(dateStr)} ${time}`
}
