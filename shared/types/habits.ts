export type TrackingType = 'BOOLEAN' | 'COUNT' | 'DURATION' | 'QUANTITY'
export type HabitScheduleType = 'EVERY_DAY' | 'WEEKDAYS' | 'TIMES_PER_WEEK' | 'INTERVAL'
export type HabitEntryStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'SKIPPED' | 'MISSED'

export interface HabitScheduleDto {
  id: string
  type: HabitScheduleType
  weekdays: number[]
  timesPerWeek: number | null
  intervalDays: number | null
  startDate: string
  endDate: string | null
}

export interface HabitEntryDto {
  id: string
  habitId: string
  date: string
  value: number | null
  status: HabitEntryStatus
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface HabitDto {
  id: string
  title: string
  description: string | null
  trackingType: TrackingType
  targetValue: number | null
  unit: string | null
  color: string | null
  icon: string | null
  archivedAt: string | null
  schedule: HabitScheduleDto
  entries?: HabitEntryDto[]
  createdAt: string
  updatedAt: string
}
