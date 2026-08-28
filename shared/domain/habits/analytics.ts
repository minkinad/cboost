import type { HabitDto, HabitEntryStatus } from '../../types/habits'
import type { DailySeriesPoint, TrackerStats } from '../../types/tracker'
import { dateKeyRange, lastDateKeys } from '../../utils/dates'
import { getEntryStatusForDate } from './entries'
import { canRecordEntryForDate, isHabitScheduledForDate } from './schedule'

export interface ExpectedEntry {
  habitId: string
  date: string
  status: HabitEntryStatus
}

export interface DailyCompletion {
  date: string
  scheduled: number
  expected: number
  completed: number
  skipped: number
  missed: number
  rate: number
  perfect: boolean
}

function habitDates(habit: HabitDto, throughDate: string): string[] {
  const end = habit.schedule.endDate && habit.schedule.endDate < throughDate
    ? habit.schedule.endDate
    : throughDate
  return dateKeyRange(habit.schedule.startDate, end)
}

export function calculateExpectedEntries(
  habits: HabitDto[],
  dates: string[],
  userToday: string
): ExpectedEntry[] {
  return dates.flatMap((date) => habits.flatMap((habit) => {
    const scheduled = date === userToday
      ? canRecordEntryForDate(habit, date)
      : isHabitScheduledForDate(habit, habit.schedule, date)

    if (!scheduled) {
      return []
    }

    return [{
      habitId: habit.id,
      date,
      status: getEntryStatusForDate(habit, date, userToday) ?? 'PENDING'
    }]
  }))
}

export function calculateDailyCompletion(
  habits: HabitDto[],
  date: string,
  userToday: string
): DailyCompletion {
  const entries = calculateExpectedEntries(habits, [date], userToday)
  const skipped = entries.filter((entry) => entry.status === 'SKIPPED').length
  const completed = entries.filter((entry) => entry.status === 'COMPLETED').length
  const missed = entries.filter((entry) => entry.status === 'MISSED').length
  const expected = entries.length - skipped

  return {
    date,
    scheduled: entries.length,
    expected,
    completed,
    skipped,
    missed,
    rate: expected === 0 ? 0 : Math.round((completed / expected) * 100),
    perfect: expected > 0 && completed === expected
  }
}

export function calculateHabitStreak(habit: HabitDto, userToday: string): number {
  const scheduledDates = habitDates(habit, userToday)
    .filter((date) => isHabitScheduledForDate(habit, habit.schedule, date))
    .reverse()
  let streak = 0

  for (const date of scheduledDates) {
    const status = getEntryStatusForDate(habit, date, userToday)

    if (status === 'COMPLETED') {
      streak += 1
      continue
    }

    if (status === 'SKIPPED' || (date === userToday && status !== 'MISSED')) {
      continue
    }

    break
  }

  return streak
}

export function calculateBestHabitStreak(habit: HabitDto, userToday: string): number {
  const scheduledDates = habitDates(habit, userToday)
    .filter((date) => isHabitScheduledForDate(habit, habit.schedule, date))
  let current = 0
  let best = 0

  for (const date of scheduledDates) {
    const status = getEntryStatusForDate(habit, date, userToday)

    if (status === 'COMPLETED') {
      current += 1
      best = Math.max(best, current)
    } else if (status !== 'SKIPPED' && date < userToday) {
      current = 0
    }
  }

  return best
}

export function calculatePerfectDayStreak(habits: HabitDto[], userToday: string): number {
  const starts = habits.map((habit) => habit.schedule.startDate).sort()
  const firstDate = starts[0]

  if (!firstDate) {
    return 0
  }

  let streak = 0

  for (const date of dateKeyRange(firstDate, userToday).reverse()) {
    const day = calculateDailyCompletion(habits, date, userToday)

    if (day.expected === 0 || (date === userToday && !day.perfect)) {
      continue
    }

    if (!day.perfect) {
      break
    }

    streak += 1
  }

  return streak
}

function summarize(habits: HabitDto[], dates: string[], today: string) {
  const days = dates.map((date) => calculateDailyCompletion(habits, date, today))
  const completed = days.reduce((total, day) => total + day.completed, 0)
  const expected = days.reduce((total, day) => total + day.expected, 0)
  return { completed, expected, rate: expected === 0 ? 0 : Math.round((completed / expected) * 100), days }
}

export function calculateTrackerStats(habits: HabitDto[], userToday: string): TrackerStats {
  const week = summarize(habits, lastDateKeys(7, userToday), userToday)
  const month = summarize(habits, lastDateKeys(30, userToday), userToday)
  const dailySeries: DailySeriesPoint[] = lastDateKeys(28, userToday).map((date) => {
    const day = calculateDailyCompletion(habits, date, userToday)
    return { date, expected: day.expected, completed: day.completed }
  })
  const streaks = habits.map((habit) => ({
    habit,
    current: calculateHabitStreak(habit, userToday),
    best: calculateBestHabitStreak(habit, userToday)
  }))
  const bestHabit = streaks.sort((left, right) => right.current - left.current || right.best - left.best)[0]

  return {
    weekCompletionRate: week.rate,
    monthCompletionRate: month.rate,
    weekCompleted: week.completed,
    weekExpected: week.expected,
    monthCompleted: month.completed,
    monthExpected: month.expected,
    perfectDayStreak: calculatePerfectDayStreak(habits, userToday),
    bestHabit: bestHabit
      ? { id: bestHabit.habit.id, title: bestHabit.habit.title, currentStreak: bestHabit.current, bestStreak: bestHabit.best }
      : null,
    dailySeries
  }
}
