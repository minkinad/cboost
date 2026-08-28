import type { HabitDto, HabitEntryStatus, TrackingType } from '../../types/habits'
import { canRecordEntryForDate, isHabitScheduledForDate } from './schedule'

export class HabitDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HabitDomainError'
  }
}

export interface EntryStatusInput {
  trackingType: TrackingType
  targetValue: number | null
  value?: number | null
  completed?: boolean
  explicitStatus?: 'SKIPPED'
}

export interface CalculatedEntryState {
  value: number | null
  status: Exclude<HabitEntryStatus, 'MISSED'>
}

/** The only persisted entry-status calculation. MISSED is derived separately. */
export function calculateEntryStatus(input: EntryStatusInput): CalculatedEntryState {
  if (input.explicitStatus === 'SKIPPED') {
    if (input.value != null || input.completed != null) {
      throw new HabitDomainError('SKIPPED не должен содержать value или completed')
    }

    return { value: null, status: 'SKIPPED' }
  }

  if (input.trackingType === 'BOOLEAN') {
    if (input.value != null) {
      throw new HabitDomainError('BOOLEAN entry не использует value')
    }

    return { value: null, status: input.completed === true ? 'COMPLETED' : 'PENDING' }
  }

  if (input.completed != null) {
    throw new HabitDomainError('Числовая привычка использует value, а не completed')
  }

  if (input.value == null || !Number.isFinite(input.value)) {
    throw new HabitDomainError('Для числовой привычки требуется value')
  }

  if (input.targetValue == null || input.targetValue <= 0) {
    throw new HabitDomainError('У числовой привычки отсутствует корректный targetValue')
  }

  if (input.value <= 0) {
    return { value: Math.max(0, input.value), status: 'PENDING' }
  }

  return {
    value: input.value,
    status: input.value >= input.targetValue ? 'COMPLETED' : 'PARTIAL'
  }
}

/** Effective status adds derived MISSED without persisting it. */
export function getEntryStatusForDate(
  habit: HabitDto,
  date: string,
  userToday: string
): HabitEntryStatus | null {
  const scheduled = date === userToday
    ? canRecordEntryForDate(habit, date)
    : isHabitScheduledForDate(habit, habit.schedule, date)

  if (!scheduled) {
    return null
  }

  const entry = (habit.entries ?? []).find((candidate) => candidate.date === date)

  if (entry?.status === 'PENDING' && date < userToday) {
    return 'MISSED'
  }

  if (entry) {
    return entry.status
  }

  return date < userToday ? 'MISSED' : 'PENDING'
}

export function trackingStep(trackingType: TrackingType): number {
  return trackingType === 'QUANTITY' ? 0.1 : 1
}

export function adjustTrackingValue(trackingType: TrackingType, value: number | null, direction: -1 | 1): number {
  const next = Math.max(0, (value ?? 0) + trackingStep(trackingType) * direction)
  return Number(next.toFixed(3))
}
