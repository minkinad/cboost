import type {
  DailySeriesPoint,
  Habit,
  HabitCreateInput,
  TrackerState,
  TrackerStats
} from '../types/tracker'
import { isValid } from 'date-fns'
import { getDateKey, isDateKey, lastNDays, parseDateKey } from './dates'

export const DEFAULT_HABIT_COLOR = '#ff5c3d'
export const HABIT_COLORS: readonly string[] = [
  DEFAULT_HABIT_COLOR,
  '#0f7173',
  '#2f6fed',
  '#e67e22',
  '#198754',
  '#b33951'
]

function getDueWeekday(habit: Habit): number {
  return new Date(habit.createdAt).getDay()
}

export function isHabitDueOnDate(habit: Habit, dateKey: string): boolean {
  if (!isDateKey(dateKey)) {
    return false
  }

  const createdAt = new Date(habit.createdAt)

  if (!isValid(createdAt) || dateKey < getDateKey(createdAt)) {
    return false
  }

  if (habit.frequency === 'daily') {
    return true
  }

  // Для weekly привычки "день выполнения" фиксируем по дате создания.
  return parseDateKey(dateKey).getDay() === getDueWeekday(habit)
}

export function createHabit(input: HabitCreateInput, now = new Date()): Habit {
  const title = input.title.trim()

  if (!title) {
    throw new Error('Название привычки обязательно')
  }

  const unit = input.unit.trim() || 'раз'
  const color = HABIT_COLORS.includes(input.color) ? input.color : DEFAULT_HABIT_COLOR

  return {
    id: crypto.randomUUID(),
    title,
    description: (input.description || '').trim(),
    frequency: input.frequency,
    target: Number.isFinite(input.target) ? Math.max(1, Math.round(input.target)) : 1,
    unit,
    color,
    createdAt: now.toISOString(),
    completions: []
  }
}

export function normalizeState(state: TrackerState | null | undefined): TrackerState {
  if (!state || !Array.isArray(state.habits)) {
    return {
      habits: [],
      updatedAt: new Date().toISOString()
    }
  }

  // Нормализуем данные из localStorage/API, чтобы избежать падений UI.
  return {
    habits: state.habits.map((habit) => {
      const createdAt = new Date(habit.createdAt)

      return {
        ...habit,
        title: `${habit.title || ''}`.trim(),
        description: `${habit.description || ''}`.trim(),
        unit: `${habit.unit || 'раз'}`.trim() || 'раз',
        target: Math.max(1, Math.round(habit.target || 1)),
        color: HABIT_COLORS.includes(habit.color) ? habit.color : DEFAULT_HABIT_COLOR,
        createdAt: isValid(createdAt) ? createdAt.toISOString() : new Date().toISOString(),
        completions: Array.from(new Set((habit.completions || []).filter(isDateKey))).sort()
      }
    }),
    updatedAt: state.updatedAt || new Date().toISOString()
  }
}

export function toggleCompletion(habit: Habit, dateKey: string): Habit {
  if (!isDateKey(dateKey)) {
    throw new Error('Неверный формат даты')
  }

  const completions = new Set(habit.completions)

  if (completions.has(dateKey)) {
    completions.delete(dateKey)
  } else {
    completions.add(dateKey)
  }

  return {
    ...habit,
    completions: Array.from(completions).sort()
  }
}

function summarizeRange(habits: Habit[], dateKeys: string[]): { expected: number; completed: number } {
  let expected = 0
  let completed = 0

  for (const dateKey of dateKeys) {
    for (const habit of habits) {
      if (!isHabitDueOnDate(habit, dateKey)) {
        continue
      }

      expected += 1

      if (habit.completions.includes(dateKey)) {
        completed += 1
      }
    }
  }

  return { expected, completed }
}

function getActiveStreak(habits: Habit[], now = new Date()): number {
  const horizon = lastNDays(365, now)
  let streak = 0

  for (const dateKey of [...horizon].reverse()) {
    const hasAnyCompletion = habits.some((habit) => habit.completions.includes(dateKey))

    if (!hasAnyCompletion) {
      break
    }

    streak += 1
  }

  return streak
}

function getTopHabit(habits: Habit[], monthKeys: string[]): Habit | null {
  if (!habits.length) {
    return null
  }

  const scored = habits
    .map((habit) => {
      const dueCount = monthKeys.filter((dateKey) => isHabitDueOnDate(habit, dateKey)).length
      const completedCount = monthKeys.filter(
        (dateKey) => isHabitDueOnDate(habit, dateKey) && habit.completions.includes(dateKey)
      ).length
      const ratio = dueCount === 0 ? 0 : completedCount / dueCount

      return {
        habit,
        completedCount,
        ratio
      }
    })
    .sort((left, right) => {
      if (right.ratio !== left.ratio) {
        return right.ratio - left.ratio
      }

      return right.completedCount - left.completedCount
    })

  return scored[0]?.habit || null
}

function roundPercent(value: number): number {
  return Math.round(value * 100)
}

export function calculateStats(habits: Habit[], now = new Date()): TrackerStats {
  const weekKeys = lastNDays(7, now)
  const monthKeys = lastNDays(30, now)
  const heatmapKeys = lastNDays(28, now)

  const week = summarizeRange(habits, weekKeys)
  const month = summarizeRange(habits, monthKeys)

  const dailySeries: DailySeriesPoint[] = heatmapKeys.map((dateKey) => {
    const point = summarizeRange(habits, [dateKey])

    return {
      date: dateKey,
      expected: point.expected,
      completed: point.completed
    }
  })

  // Сводка для карточек аналитики и тепловой карты.
  return {
    weekCompletionRate: week.expected === 0 ? 0 : roundPercent(week.completed / week.expected),
    monthCompletionRate: month.expected === 0 ? 0 : roundPercent(month.completed / month.expected),
    weekCompleted: week.completed,
    weekExpected: week.expected,
    monthCompleted: month.completed,
    monthExpected: month.expected,
    activeStreak: getActiveStreak(habits, now),
    topHabit: getTopHabit(habits, monthKeys),
    dailySeries
  }
}
