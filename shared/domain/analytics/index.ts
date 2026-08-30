import type { GoalDto } from '../../types/organization'
import type {
  GoalProgressDto,
  HabitAnalyticsDto,
  HeatmapDay,
  HeatmapIntensity,
  PeriodAnalytics,
  WeekdayAnalytics,
  WeeklyReviewDto
} from '../../types/analytics'
import type { HabitDto, HabitEntryStatus } from '../../types/habits'
import { addDaysToDateKey, dateKeyRange, getIsoWeekDateKeys, lastDateKeys } from '../../utils/dates'
import {
  calculateBestHabitStreak,
  calculateDailyCompletion,
  calculateHabitStreak,
  getEntryStatusForDate,
  isHabitScheduledForDate
} from '../habits'

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function round(value: number, precision = 0): number {
  const factor = 10 ** precision
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function statusCount(habits: HabitDto[], dates: string[], today: string, status: HabitEntryStatus): number {
  return dates.reduce((total, date) => total + habits.filter((habit) => getEntryStatusForDate(habit, date, today) === status).length, 0)
}

export function calculatePeriodAnalytics(habits: HabitDto[], dates: string[], today: string): PeriodAnalytics {
  const days = dates.map((date) => calculateDailyCompletion(habits, date, today))
  const expected = days.reduce((total, day) => total + day.expected, 0)
  const completed = days.reduce((total, day) => total + day.completed, 0)
  return {
    startDate: dates[0] ?? today,
    endDate: dates.at(-1) ?? today,
    completed,
    partial: statusCount(habits, dates, today, 'PARTIAL'),
    skipped: statusCount(habits, dates, today, 'SKIPPED'),
    missed: statusCount(habits, dates, today, 'MISSED'),
    pending: statusCount(habits, dates, today, 'PENDING'),
    expected,
    rate: expected === 0 ? 0 : Math.round(completed / expected * 100)
  }
}

export function heatmapIntensity(rate: number, expected: number): HeatmapIntensity {
  if (expected === 0 || rate <= 0) return 0
  if (rate <= 25) return 1
  if (rate <= 50) return 2
  if (rate <= 75) return 3
  if (rate < 100) return 4
  return 5
}

export function calculateHeatmap(habits: HabitDto[], dates: string[], today: string): HeatmapDay[] {
  return dates.map((date) => {
    const day = calculateDailyCompletion(habits, date, today)
    return { date, completed: day.completed, expected: day.expected, rate: day.rate, intensity: heatmapIntensity(day.rate, day.expected) }
  })
}

export function calculateWeekdayAnalytics(habits: HabitDto[], dates: string[], today: string): WeekdayAnalytics[] {
  return weekdayLabels.map((label, weekday) => {
    const matchingDates = dates.filter((date) => new Date(`${date}T00:00:00.000Z`).getUTCDay() === weekday)
    const period = calculatePeriodAnalytics(habits, matchingDates, today)
    return { weekday, label, completed: period.completed, expected: period.expected, rate: period.rate }
  })
}

function completionRate(habit: HabitDto, dates: string[], today: string): number {
  return calculatePeriodAnalytics([habit], dates, today).rate
}

export function calculateHabitAnalytics(habit: HabitDto, today: string): HabitAnalyticsDto {
  const numericDates = lastDateKeys(90, today).filter((date) => isHabitScheduledForDate(habit, habit.schedule, date))
  const expectedDates = numericDates.filter((date) => getEntryStatusForDate(habit, date, today) !== 'SKIPPED')
  const values = expectedDates.map((date) => ({
    date,
    value: habit.entries?.find((entry) => entry.date === date)?.value ?? 0
  }))
  const target = habit.targetValue ?? 0
  const best = values.reduce<(typeof values)[number] | null>((current, candidate) => !current || candidate.value > current.value ? candidate : current, null)
  const numeric = habit.trackingType === 'BOOLEAN'
    ? null
    : {
        averageValue: values.length ? round(values.reduce((total, entry) => total + entry.value, 0) / values.length, 3) : 0,
        averageTargetAchievement: values.length && target > 0
          ? round(values.reduce((total, entry) => total + Math.min(100, entry.value / target * 100), 0) / values.length, 1)
          : 0,
        bestDay: best ? { date: best.date, value: best.value, achievement: target > 0 ? round(best.value / target * 100, 1) : 0 } : null
      }

  return {
    habitId: habit.id,
    title: habit.title,
    currentStreak: calculateHabitStreak(habit, today),
    bestStreak: calculateBestHabitStreak(habit, today),
    completion7Days: completionRate(habit, lastDateKeys(7, today), today),
    completion30Days: completionRate(habit, lastDateKeys(30, today), today),
    completion90Days: completionRate(habit, lastDateKeys(90, today), today),
    history30Days: lastDateKeys(30, today).map((date) => ({ date, status: getEntryStatusForDate(habit, date, today) })),
    numeric
  }
}

function lastScheduledDates(habit: HabitDto, today: string, limit: number): string[] {
  if (habit.schedule.startDate > today) return []
  return dateKeyRange(habit.schedule.startDate, today)
    .filter((date) => isHabitScheduledForDate(habit, habit.schedule, date))
    .slice(-limit)
}

export function calculateGoalProgress(goal: GoalDto, habits: HabitDto[], today: string): GoalProgressDto {
  const rates = goal.habits.flatMap((link) => {
    const habit = habits.find((candidate) => candidate.id === link.habitId)
    if (!habit) return []
    return [{
      habitId: habit.id,
      title: habit.title,
      weight: link.weight,
      completionRate: completionRate(habit, lastScheduledDates(habit, today, 30), today)
    }]
  })
  const totalWeight = rates.reduce((total, habit) => total + habit.weight, 0)
  const progress = totalWeight === 0 ? 0 : round(rates.reduce((total, habit) => total + habit.completionRate * habit.weight, 0) / totalWeight)
  return { goalId: goal.id, title: goal.title, progress, habits: rates }
}

export function calculateWeeklyReview(habits: HabitDto[], today: string): WeeklyReviewDto {
  const currentDates = getIsoWeekDateKeys(today).filter((date) => date <= today)
  const previousDates = getIsoWeekDateKeys(addDaysToDateKey(today, -7))
  const current = calculatePeriodAnalytics(habits, currentDates, today)
  const previous = calculatePeriodAnalytics(habits, previousDates, today)
  const habitRates = habits.map((habit) => ({
    habitId: habit.id,
    title: habit.title,
    rate: completionRate(habit, currentDates, today),
    expected: calculatePeriodAnalytics([habit], currentDates, today).expected
  })).filter((habit) => habit.expected > 0)
  const ordered = [...habitRates].sort((left, right) => right.rate - left.rate || left.title.localeCompare(right.title))
  const weakest = [...habitRates].sort((left, right) => left.rate - right.rate || left.title.localeCompare(right.title))[0]
  const weakestHabit = weakest ? habits.find((habit) => habit.id === weakest.habitId) : undefined
  const weekday = weakestHabit
    ? calculateWeekdayAnalytics([weakestHabit], lastDateKeys(90, today), today)
        .filter((day) => day.expected > 0)
        .sort((left, right) => left.rate - right.rate || left.weekday - right.weekday)[0]
    : undefined
  const streaks = habits.map((habit) => ({ habitId: habit.id, title: habit.title, streak: calculateHabitStreak(habit, today) }))
    .sort((left, right) => right.streak - left.streak || left.title.localeCompare(right.title))
  return {
    overall: current.rate,
    changePercentagePoints: current.rate - previous.rate,
    strongestHabits: ordered.slice(0, 2).map(({ expected: _expected, ...habit }) => habit),
    needsAttention: weakest && weakest.rate < current.rate ? [{ habitId: weakest.habitId, title: weakest.title, rate: weakest.rate }] : [],
    pattern: weakest && weekday
      ? {
          habitId: weakest.habitId,
          weekday: weekday.weekday,
          weekdayLabel: weekday.label,
          rate: weekday.rate,
          statement: `${weakest.title} has its lowest completion rate on ${weekday.label}s.`
        }
      : null,
    longestStreak: streaks[0]?.streak ? streaks[0] : null
  }
}

export function currentAndPreviousWeek(habits: HabitDto[], today: string) {
  const currentDates = getIsoWeekDateKeys(today).filter((date) => date <= today)
  const previousDates = getIsoWeekDateKeys(addDaysToDateKey(today, -7))
  return {
    current: calculatePeriodAnalytics(habits, currentDates, today),
    previous: calculatePeriodAnalytics(habits, previousDates, today)
  }
}
