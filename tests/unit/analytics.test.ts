import { describe, expect, it } from 'vitest'
import {
  calculateGoalProgress,
  calculateHabitAnalytics,
  calculateHeatmap,
  calculatePeriodAnalytics,
  calculateWeekdayAnalytics,
  calculateWeeklyReview,
  currentAndPreviousWeek,
  heatmapIntensity
} from '../../shared/domain/analytics'
import type { HabitDto, HabitEntryStatus } from '../../shared/types/habits'
import type { GoalDto } from '../../shared/types/organization'

const TODAY = '2026-08-27'

function habit(id: string, title: string, startDate = '2026-08-17', entries: Array<[string, HabitEntryStatus, number?]> = [], targetValue: number | null = null): HabitDto {
  return {
    id,
    title,
    description: null,
    trackingType: targetValue == null ? 'BOOLEAN' : 'COUNT',
    targetValue,
    unit: targetValue == null ? null : 'times',
    color: null,
    icon: null,
    categoryId: null,
    archivedAt: null,
    schedule: { id: `schedule-${id}`, type: 'EVERY_DAY', weekdays: [], timesPerWeek: null, intervalDays: null, startDate, endDate: null },
    entries: entries.map(([date, status, value], index) => ({ id: `${id}-${index}`, habitId: id, date, status, value: value ?? null, note: null, createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z` })),
    createdAt: `${startDate}T10:00:00.000Z`,
    updatedAt: `${startDate}T10:00:00.000Z`
  }
}

function goal(habits: Array<{ habitId: string; weight: number }>): GoalDto {
  return { id: 'goal-1', title: 'English B2', description: null, targetDate: null, status: 'ACTIVE', habits, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' }
}

describe('period and heatmap analytics', () => {
  it('compares the current partial ISO week with the previous full week', () => {
    const reading = habit('reading', 'Reading', '2026-08-17', [
      ['2026-08-17', 'COMPLETED'], ['2026-08-18', 'COMPLETED'], ['2026-08-19', 'COMPLETED'],
      ['2026-08-24', 'COMPLETED'], ['2026-08-25', 'COMPLETED'], ['2026-08-26', 'COMPLETED']
    ])
    const weeks = currentAndPreviousWeek([reading], TODAY)
    expect(weeks.current).toMatchObject({ completed: 3, expected: 4, rate: 75 })
    expect(weeks.previous).toMatchObject({ completed: 3, expected: 7, rate: 43 })
    expect(weeks.current.rate - weeks.previous.rate).toBe(32)
  })

  it('uses completion / expected and maps every documented intensity band', () => {
    expect([0, 10, 40, 60, 90, 100].map((rate) => heatmapIntensity(rate, 4))).toEqual([0, 1, 2, 3, 4, 5])
    const habits = [
      habit('a', 'A', TODAY, [[TODAY, 'COMPLETED']]),
      habit('b', 'B', TODAY, [[TODAY, 'PARTIAL']]),
      habit('c', 'C', TODAY),
      habit('d', 'D', TODAY)
    ]
    expect(calculateHeatmap(habits, [TODAY], TODAY)[0]).toMatchObject({ completed: 1, expected: 4, rate: 25, intensity: 1 })
  })

  it('keeps status totals and completion rate deterministic', () => {
    const date = '2026-08-26'
    const habits = [
      habit('a', 'A', date, [[date, 'COMPLETED']]),
      habit('b', 'B', date, [[date, 'PARTIAL']]),
      habit('c', 'C', date, [[date, 'SKIPPED']]),
      habit('d', 'D', date)
    ]
    expect(calculatePeriodAnalytics(habits, [date], TODAY)).toMatchObject({ completed: 1, partial: 1, skipped: 1, missed: 1, expected: 3, rate: 33 })
  })
})

describe('habit and weekday analytics', () => {
  it('calculates numeric averages, target achievement and the best day', () => {
    const pushups = habit('pushups', 'Push-ups', '2026-08-25', [
      ['2026-08-25', 'PARTIAL', 5], ['2026-08-26', 'COMPLETED', 10], ['2026-08-27', 'COMPLETED', 15]
    ], 10)
    const result = calculateHabitAnalytics(pushups, TODAY)
    expect(result).toMatchObject({ completion7Days: 67, completion30Days: 67, completion90Days: 67 })
    expect(result.numeric).toEqual({ averageValue: 10, averageTargetAchievement: 83.3, bestDay: { date: '2026-08-27', value: 15, achievement: 150 } })
  })

  it('aggregates completion by calendar weekday', () => {
    const reading = habit('reading', 'Reading', '2026-08-17', [['2026-08-24', 'COMPLETED']])
    const dates = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27']
    const monday = calculateWeekdayAnalytics([reading], dates, TODAY).find((day) => day.label === 'Monday')
    expect(monday).toMatchObject({ completed: 1, expected: 2, rate: 50 })
  })
})

describe('goal progress and weekly review', () => {
  const first = habit('first', 'Reading', '2026-08-25', [['2026-08-25', 'COMPLETED'], ['2026-08-26', 'COMPLETED'], ['2026-08-27', 'COMPLETED']])
  const second = habit('second', 'Speaking', '2026-08-25', [['2026-08-25', 'COMPLETED']])

  it('uses the mean of linked habit rates for equal weights', () => {
    expect(calculateGoalProgress(goal([{ habitId: 'first', weight: 1 }, { habitId: 'second', weight: 1 }]), [first, second], TODAY).progress).toBe(67)
  })

  it('uses a weighted mean when explicit weights differ', () => {
    expect(calculateGoalProgress(goal([{ habitId: 'first', weight: 2 }, { habitId: 'second', weight: 1 }]), [first, second], TODAY).progress).toBe(78)
  })

  it('derives weekly insights only from calculated facts', () => {
    const strong = habit('strong', 'Reading', '2026-08-24', [['2026-08-24', 'COMPLETED'], ['2026-08-25', 'COMPLETED'], ['2026-08-26', 'COMPLETED'], ['2026-08-27', 'COMPLETED']])
    const weak = habit('weak', 'Exercise', '2026-08-24', [['2026-08-24', 'COMPLETED'], ['2026-08-26', 'COMPLETED']])
    const review = calculateWeeklyReview([strong, weak], TODAY)
    expect(review.overall).toBe(75)
    expect(review.strongestHabits[0]).toEqual({ habitId: 'strong', title: 'Reading', rate: 100 })
    expect(review.needsAttention).toEqual([{ habitId: 'weak', title: 'Exercise', rate: 50 }])
    expect(review.pattern).toMatchObject({ habitId: 'weak', weekdayLabel: 'Tuesday', rate: 0 })
    expect(review.pattern?.statement).toBe('Exercise has its lowest completion rate on Tuesdays.')
    expect(review.longestStreak).toEqual({ habitId: 'strong', title: 'Reading', streak: 4 })
  })
})
