// 活动时间人性化展示，与小程序 formatEventDate/formatEventDateTime 一致。
import { getChinaDateParts, getChinaDayStartMs } from './chinaTime'

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

/** 今天/明天/后天；未来 7 天内加（周几）；今年省略年份；跨年显示完整年月日。 */
export function formatEventDate(dateStr?: string | number): string {
  if (!dateStr) return '时间待定'
  const date = getChinaDateParts(dateStr)
  if (!date) return String(dateStr)

  const now = getChinaDateParts(Date.now())!
  const todayStart = getChinaDayStartMs(Date.now())
  const targetStart = getChinaDayStartMs(dateStr)
  const diffDays = Math.round((targetStart - todayStart) / 86400000)
  const m = date.month
  const d = date.day

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === 2) return '后天'
  if (diffDays >= 3 && diffDays <= 7) return `${m}月${d}日（周${WEEK_CN[date.weekDay]}）`
  if (date.year === now.year) return `${m}月${d}日`
  return `${date.year}年${m}月${d}日`
}

/** 日期(人性化) + 时间 HH:mm。 */
export function formatEventDateTime(dateStr?: string | number): string {
  if (!dateStr) return '时间待定'
  const date = getChinaDateParts(dateStr)
  if (!date) return String(dateStr)
  const hh = date.hours.toString().padStart(2, '0')
  const mm = date.minutes.toString().padStart(2, '0')
  return `${formatEventDate(dateStr)} ${hh}:${mm}`
}
