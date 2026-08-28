import { format, isMatch, isValid, parse, subDays } from 'date-fns'

export const DATE_KEY_FORMAT = 'yyyy-MM-dd'

export function getDateKey(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Неверная дата')
  }

  return format(date, DATE_KEY_FORMAT)
}

export function isDateKey(value: string): boolean {
  if (!isMatch(value, DATE_KEY_FORMAT)) {
    return false
  }

  const parsed = parse(value, DATE_KEY_FORMAT, new Date(0))
  return isValid(parsed) && format(parsed, DATE_KEY_FORMAT) === value
}

export function parseDateKey(value: string): Date {
  if (!isDateKey(value)) {
    throw new Error('Неверный формат календарной даты')
  }

  return parse(value, DATE_KEY_FORMAT, new Date(0))
}

export function dateKeyToDatabaseDate(value: string): Date {
  if (!isDateKey(value)) {
    throw new Error('Неверный формат календарной даты')
  }

  return new Date(`${value}T00:00:00.000Z`)
}

export function databaseDateToDateKey(value: Date): string {
  if (!isValid(value)) {
    throw new Error('Неверная дата базы данных')
  }

  return value.toISOString().slice(0, 10)
}

export function getDateKeyInTimeZone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function getWeekdayInTimeZone(date: Date, timezone: string): number {
  const dateKey = getDateKeyInTimeZone(date, timezone)
  return dateKeyToDatabaseDate(dateKey).getUTCDay()
}

export function lastNDays(length: number, endDate = new Date()): string[] {
  const safeLength = Math.max(0, Math.floor(length))

  return Array.from({ length: safeLength }, (_, index) => {
    const offset = safeLength - index - 1
    return getDateKey(subDays(endDate, offset))
  })
}
