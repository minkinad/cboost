import { describe, expect, it } from 'vitest'
import type { Habit } from '../../shared/types/tracker'
import {
  calculateStats,
  isHabitDueOnDate,
  normalizeState,
  toggleCompletion
} from '../../shared/utils/tracker'
import { getDateKey, isDateKey, lastNDays } from '../../shared/utils/dates'

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    title: 'Чтение',
    description: '',
    frequency: 'daily',
    target: 1,
    unit: 'раз',
    color: '#ff5c3d',
    createdAt: new Date(2026, 7, 27, 12).toISOString(),
    completions: [],
    ...overrides
  }
}

describe('calendar date helpers', () => {
  it('uses local calendar dates and rejects impossible dates', () => {
    expect(getDateKey(new Date(2026, 7, 27, 23, 30))).toBe('2026-08-27')
    expect(isDateKey('2026-08-27')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
  })

  it('creates an inclusive ordered date window', () => {
    expect(lastNDays(3, new Date(2026, 7, 27, 12))).toEqual([
      '2026-08-25',
      '2026-08-26',
      '2026-08-27'
    ])
  })
})

describe('habit domain rules', () => {
  it('does not schedule a habit before its creation date', () => {
    const habit = makeHabit()

    expect(isHabitDueOnDate(habit, '2026-08-26')).toBe(false)
    expect(isHabitDueOnDate(habit, '2026-08-27')).toBe(true)

    const stats = calculateStats([habit], new Date(2026, 7, 27, 12))
    expect(stats.weekExpected).toBe(1)
    expect(stats.monthExpected).toBe(1)
  })

  it('keeps a weekly habit on the weekday where it was created', () => {
    const habit = makeHabit({ frequency: 'weekly' })

    expect(isHabitDueOnDate(habit, '2026-08-27')).toBe(true)
    expect(isHabitDueOnDate(habit, '2026-08-28')).toBe(false)
  })

  it('toggles a valid completion and rejects invalid calendar dates', () => {
    const habit = makeHabit()
    const completed = toggleCompletion(habit, '2026-08-27')

    expect(completed.completions).toEqual(['2026-08-27'])
    expect(toggleCompletion(completed, '2026-08-27').completions).toEqual([])
    expect(() => toggleCompletion(habit, '2026-02-30')).toThrow('Неверный формат даты')
  })

  it('removes invalid and duplicate completion dates from persisted state', () => {
    const habit = makeHabit({ completions: ['2026-08-27', '2026-08-27', '2026-02-30'] })
    const state = normalizeState({ habits: [habit], updatedAt: habit.createdAt })

    expect(state.habits[0]?.completions).toEqual(['2026-08-27'])
  })
})
