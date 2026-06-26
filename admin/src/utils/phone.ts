/** 查看完整手机号的口令（暂写死；后续可移到后端按需下发） */
export const PHONE_VIEW_PASSWORD = 'offenbar'

/** 手机号脱敏：保留前 3 + 后 4，中间四位星号（138****5678）。非 11 位则原样返回。 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return ''
  const s = String(phone).trim()
  if (s.length !== 11) return s
  return s.slice(0, 3) + '****' + s.slice(7)
}
