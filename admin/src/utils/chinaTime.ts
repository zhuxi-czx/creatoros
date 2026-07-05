import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const CHINA_TIMEZONE = 'Asia/Shanghai'

export function toChinaTime(value?: string | Date | null): Dayjs | undefined {
  if (!value) return undefined
  const d = dayjs.utc(value).tz(CHINA_TIMEZONE)
  return d.isValid() ? d : undefined
}

export function formatChinaTime(value?: string | Date | null, format = 'YYYY-MM-DD HH:mm'): string {
  return toChinaTime(value)?.format(format) || '-'
}

export function chinaDatePickerValueToIso(value?: Dayjs | null): string | undefined {
  if (!value) return undefined
  const wallTime = value.format('YYYY-MM-DD HH:mm:ss')
  return dayjs.tz(wallTime, CHINA_TIMEZONE).toISOString()
}

export function isAfterChinaEventDay(value?: string | Date | null): boolean {
  const start = toChinaTime(value)
  if (!start) return false
  return dayjs().tz(CHINA_TIMEZONE).isAfter(start.add(1, 'day').startOf('day'))
}
