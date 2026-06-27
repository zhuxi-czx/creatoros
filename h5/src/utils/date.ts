// 活动时间人性化展示，与小程序 formatEventDate/formatEventDateTime 一致。
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

/** 今天/明天/后天；未来 7 天内加（周几）；今年省略年份；跨年显示完整年月日。 */
export function formatEventDate(dateStr?: string | number): string {
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
  if (diffDays >= 3 && diffDays <= 7) return `${m}月${d}日（周${WEEK_CN[date.getDay()]}）`
  if (date.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${date.getFullYear()}年${m}月${d}日`
}

/** 日期(人性化) + 时间 HH:mm。 */
export function formatEventDateTime(dateStr?: string | number): string {
  if (!dateStr) return '时间待定'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${formatEventDate(dateStr)} ${hh}:${mm}`
}
