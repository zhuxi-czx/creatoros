const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000

export interface ChinaDateParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  weekDay: number
}

export function getChinaDateParts(dateStr?: string | number | Date): ChinaDateParts | null {
  if (!dateStr) return null
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return null
  const china = new Date(time + CHINA_OFFSET_MS)
  return {
    year: china.getUTCFullYear(),
    month: china.getUTCMonth() + 1,
    day: china.getUTCDate(),
    hours: china.getUTCHours(),
    minutes: china.getUTCMinutes(),
    weekDay: china.getUTCDay(),
  }
}

export function getChinaDayStartMs(dateStr?: string | number | Date): number {
  if (!dateStr) return 0
  const time = new Date(dateStr).getTime()
  if (!Number.isFinite(time)) return 0
  const china = new Date(time + CHINA_OFFSET_MS)
  return Date.UTC(china.getUTCFullYear(), china.getUTCMonth(), china.getUTCDate()) - CHINA_OFFSET_MS
}
