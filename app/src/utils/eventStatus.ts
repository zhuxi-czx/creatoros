// 活动展示状态（按时间实时计算，与"上架/下架"无关）
// 报名中 → 报名结束(到开始时间/满员) → 已结束(次日0点)
export type EventDisplayState = 'OPEN' | 'CLOSED' | 'ENDED'

export interface EventDisplay {
  state: EventDisplayState
  label: string
  color: string
}

export function getEventDisplay(
  dateStr: string | undefined,
  signupCount = 0,
  maxCapacity?: number,
): EventDisplay {
  if (!dateStr) return { state: 'OPEN', label: '报名中', color: '#4CAF50' }

  const start = new Date(dateStr)
  const startMs = start.getTime()
  // 已结束：活动当天的次日 0 点
  const endedMs = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 1,
    0, 0, 0, 0,
  ).getTime()
  const now = Date.now()

  if (now >= endedMs) {
    return { state: 'ENDED', label: '已结束', color: '#999999' }
  }
  const full = maxCapacity ? signupCount >= maxCapacity : false
  if (now >= startMs || full) {
    return { state: 'CLOSED', label: '报名结束', color: '#FF9800' }
  }
  return { state: 'OPEN', label: '报名中', color: '#4CAF50' }
}
