import type { LegacyImportInput } from '~~/shared/schemas/habits'
import type { HabitScheduleType, TrackingType } from '~~/shared/types/habits'
import { getDateKeyInTimeZone, getWeekdayInTimeZone } from '~~/shared/utils/dates'

export interface LegacyHabitImportRecord {
  legacySourceId: string
  title: string
  description: string | null
  trackingType: TrackingType
  targetValue: number | null
  unit: string | null
  color: string
  createdAt: Date
  schedule: {
    type: HabitScheduleType
    weekdays: number[]
    startDate: string
  }
  entries: Array<{
    date: string
    value: number | null
  }>
}

export function mapLegacyHabits(
  input: LegacyImportInput,
  timezone: string
): LegacyHabitImportRecord[] {
  return input.habits.map((habit) => {
    const createdAt = new Date(habit.createdAt)
    const isBoolean = habit.target === 1
    const trackingType: TrackingType = isBoolean ? 'BOOLEAN' : 'COUNT'
    const scheduleType: HabitScheduleType = habit.frequency === 'daily' ? 'EVERY_DAY' : 'WEEKDAYS'

    return {
      legacySourceId: habit.id,
      title: habit.title,
      description: habit.description || null,
      trackingType,
      targetValue: isBoolean ? null : habit.target,
      unit: isBoolean ? null : habit.unit,
      color: habit.color,
      createdAt,
      schedule: {
        type: scheduleType,
        weekdays: scheduleType === 'WEEKDAYS' ? [getWeekdayInTimeZone(createdAt, timezone)] : [],
        startDate: getDateKeyInTimeZone(createdAt, timezone)
      },
      entries: Array.from(new Set(habit.completions)).map((date) => ({
        date,
        value: isBoolean ? null : habit.target
      }))
    }
  })
}
