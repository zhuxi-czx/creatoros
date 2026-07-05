export const EVENT_SIGNUP_STARTED_MESSAGE = '活动已开始，报名暂停';

export function isEventStarted(eventDate?: Date | string | null, now = new Date()): boolean {
  if (!eventDate) return false;
  const start = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const startMs = start.getTime();
  return Number.isFinite(startMs) && now.getTime() >= startMs;
}
