import type { HabitDto, HabitEntryDto, HabitScheduleDto } from '../../types/habits'
import {
  dateKeyToDatabaseDate,
  getIsoWeekDateKeys,
  isDateKey
} from '../../utils/dates'

type SchedulableHabit = Pick<HabitDto, 'entries'>

function isInsideSchedule(schedule: HabitScheduleDto, date: string): boolean {
  return date >= schedule.startDate && (!schedule.endDate || date <= schedule.endDate)
}

function entriesByDate(habit: SchedulableHabit): Map<string, HabitEntryDto> {
  return new Map((habit.entries ?? []).map((entry) => [entry.date, entry]))
}

function timesPerWeekDates(habit: SchedulableHabit, schedule: HabitScheduleDto, date: string): string[] {
  const limit = schedule.timesPerWeek ?? 0
  const weekDates = getIsoWeekDateKeys(date).filter((candidate) => isInsideSchedule(schedule, candidate))
  const entries = entriesByDate(habit)
  const reservedDates = weekDates.filter((candidate) => entries.has(candidate)).slice(0, limit)
  const remaining = Math.max(0, limit - reservedDates.length)
  const availableDates = weekDates.filter((candidate) => !entries.has(candidate))
  const projectedDates = remaining === 0 ? [] : availableDates.slice(-remaining)

  return [...reservedDates, ...projectedDates]
}

/** Canonical schedule decision for Today, history, metrics and streaks. */
export function isHabitScheduledForDate(
  habit: SchedulableHabit,
  schedule: HabitScheduleDto,
  date: string
): boolean {
  if (!isDateKey(date) || !isInsideSchedule(schedule, date)) {
    return false
  }

  if (schedule.type === 'EVERY_DAY') {
    return true
  }

  if (schedule.type === 'WEEKDAYS') {
    return schedule.weekdays.includes(dateKeyToDatabaseDate(date).getUTCDay())
  }

  if (schedule.type === 'INTERVAL') {
    const start = dateKeyToDatabaseDate(schedule.startDate).getTime()
    const current = dateKeyToDatabaseDate(date).getTime()
    const elapsedDays = Math.floor((current - start) / 86_400_000)
    return elapsedDays % (schedule.intervalDays ?? 1) === 0
  }

  return timesPerWeekDates(habit, schedule, date).includes(date)
}

/** Whether an explicit entry may reserve this local calendar date. */
export function canRecordEntryForDate(habit: HabitDto, date: string): boolean {
  if (habit.schedule.type !== 'TIMES_PER_WEEK') {
    return isHabitScheduledForDate(habit, habit.schedule, date)
  }

  if (!isDateKey(date) || !isInsideSchedule(habit.schedule, date)) {
    return false
  }

  const existing = (habit.entries ?? []).find((entry) => entry.date === date)

  if (existing) {
    return true
  }

  const week = new Set(getIsoWeekDateKeys(date))
  const reservedCount = (habit.entries ?? []).filter((entry) => week.has(entry.date)).length

  if (reservedCount >= (habit.schedule.timesPerWeek ?? 0)) {
    return false
  }

  const virtualEntry: HabitEntryDto = {
    id: 'virtual',
    habitId: habit.id,
    date,
    value: null,
    status: 'PENDING',
    note: null,
    createdAt: '',
    updatedAt: ''
  }

  return isHabitScheduledForDate(
    { ...habit, entries: [...(habit.entries ?? []), virtualEntry] },
    habit.schedule,
    date
  )
}
