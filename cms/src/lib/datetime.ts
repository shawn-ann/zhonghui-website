const BEIJING = 'Asia/Shanghai'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BEIJING, year: 'numeric', month: '2-digit', day: '2-digit',
})
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: BEIJING, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 北京日历日，YYYY-MM-DD；空值/非法值返回空串。 */
export function beijingDateKey(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  const parts = dateFormatter.formatToParts(date)
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

/** 把某个时刻归一到其北京日历日的 UTC 零点。 */
export function beijingDayStart(value: string | number | Date | null | undefined): string {
  const key = beijingDateKey(value)
  return key ? `${key}T00:00:00.000Z` : ''
}

/** 后台统一时间格式：YYYY/MM/DD HH:mm:ss（Asia/Shanghai）。 */
export function formatBeijingTime(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  const day = beijingDateKey(date).replace(/-/g, '/')
  return `${day} ${timeFormatter.format(date)}`
}
