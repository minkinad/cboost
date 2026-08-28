import { differenceInCalendarDays } from 'date-fns'
import type { HabitScheduleDto } from '~~/shared/types/habits'
import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'

export function isScheduledOnDate(schedule: HabitScheduleDto, dateKey: string): boolean {
  if (dateKey < schedule.startDate || (schedule.endDate && dateKey > schedule.endDate)) {
    return false
  }

  if (schedule.type === 'DAILY') {
    return true
  }

  const date = dateKeyToDatabaseDate(dateKey)

  if (schedule.type === 'WEEKLY') {
    return schedule.weekdays.length === 0 || schedule.weekdays.includes(date.getUTCDay())
  }

  const elapsedDays = differenceInCalendarDays(date, dateKeyToDatabaseDate(schedule.startDate))
  return elapsedDays % (schedule.intervalDays ?? 1) === 0
}
