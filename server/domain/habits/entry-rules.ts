import type { HabitEntryPutInput } from '~~/shared/schemas/habits'
import type { HabitEntryStatus, TrackingType } from '~~/shared/types/habits'

export class DomainRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainRuleError'
  }
}

interface EntryState {
  value: number | null
  status: HabitEntryStatus
}

export function resolveEntryState(
  trackingType: TrackingType,
  targetValue: number | null,
  input: HabitEntryPutInput
): EntryState {
  if (input.status === 'SKIPPED' || input.status === 'MISSED') {
    if (input.value != null) {
      throw new DomainRuleError(`${input.status} entry не должен содержать value`)
    }

    return { value: null, status: input.status }
  }

  if (trackingType === 'BOOLEAN') {
    if (input.value != null) {
      throw new DomainRuleError('BOOLEAN entry не использует value')
    }

    return {
      value: null,
      status: input.status === 'PENDING' ? 'PENDING' : 'COMPLETED'
    }
  }

  if (input.value == null) {
    throw new DomainRuleError('Для числовой привычки требуется value')
  }

  if (targetValue == null || targetValue <= 0) {
    throw new DomainRuleError('У числовой привычки отсутствует корректный targetValue')
  }

  let status: HabitEntryStatus = 'PENDING'

  if (input.value >= targetValue) {
    status = 'COMPLETED'
  } else if (input.value > 0) {
    status = 'PARTIAL'
  }

  return { value: input.value, status }
}
