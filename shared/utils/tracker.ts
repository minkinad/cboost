import { isValid } from 'date-fns'
import type { Habit, HabitCreateInput, TrackerState } from '../types/tracker'
import { isDateKey } from './dates'

export const DEFAULT_HABIT_COLOR = '#ff5c3d'
export const HABIT_COLORS: readonly string[] = [
  DEFAULT_HABIT_COLOR,
  '#0f7173',
  '#2f6fed',
  '#e67e22',
  '#198754',
  '#b33951'
]

/** Legacy-only mapping used before the one-time server import. */
export function createHabit(input: HabitCreateInput, now = new Date()): Habit {
  const title = input.title.trim()

  if (!title) {
    throw new Error('Название привычки обязательно')
  }

  return {
    id: crypto.randomUUID(),
    title,
    description: (input.description || '').trim(),
    frequency: input.frequency,
    target: Number.isFinite(input.target) ? Math.max(1, Math.round(input.target)) : 1,
    unit: input.unit.trim() || 'раз',
    color: HABIT_COLORS.includes(input.color) ? input.color : DEFAULT_HABIT_COLOR,
    createdAt: now.toISOString(),
    completions: []
  }
}

/** Sanitizes the previous localStorage shape; it is not canonical domain state. */
export function normalizeState(state: TrackerState | null | undefined): TrackerState {
  if (!state || !Array.isArray(state.habits)) {
    return { habits: [], updatedAt: new Date().toISOString() }
  }

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

  return { ...habit, completions: Array.from(completions).sort() }
}
