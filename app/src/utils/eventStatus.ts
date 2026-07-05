// 活动展示状态（按时间实时计算，与"上架/下架"无关）
// 报名中 → 报名结束(到开始时间/满员) → 已结束(次日0点)
import { getNextChinaDayStartMs } from './chinaTime'

export type EventDisplayState = 'OPEN' | 'CLOSED' | 'ENDED'

export interface EventDisplay {
  state: EventDisplayState
  label: string
  color: string
  reason?: 'STARTED' | 'FULL'
}

export function getEventDisplay(
  dateStr: string | undefined,
  signupCount = 0,
  maxCapacity?: number,
): EventDisplay {
  if (!dateStr) return { state: 'OPEN', label: '报名中', color: '#4CAF50' }

  const startMs = new Date(dateStr).getTime()
  if (!Number.isFinite(startMs)) return { state: 'OPEN', label: '报名中', color: '#4CAF50' }
  // 已结束：活动当天的次日北京时间 0 点
  const endedMs = getNextChinaDayStartMs(dateStr)
  const now = Date.now()

  if (now >= endedMs) {
    return { state: 'ENDED', label: '已结束', color: '#999999' }
  }
  const full = maxCapacity ? signupCount >= maxCapacity : false
  if (full) {
    return { state: 'CLOSED', label: '报名已满', color: '#FF9800', reason: 'FULL' }
  }
  if (now >= startMs) {
    return { state: 'CLOSED', label: '报名暂停', color: '#FF9800', reason: 'STARTED' }
  }
  return { state: 'OPEN', label: '报名中', color: '#4CAF50' }
}
