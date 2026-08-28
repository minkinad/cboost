import type { HabitEntryDto, HabitEntryStatus } from '~~/shared/types/habits'

export interface HabitEntryRepository {
  findManyForHabit(userId: string, habitId: string): Promise<HabitEntryDto[]>
  upsert(input: {
    habitId: string
    date: string
    value: number | null
    status: HabitEntryStatus
    note: string | null
  }): Promise<HabitEntryDto>
}
