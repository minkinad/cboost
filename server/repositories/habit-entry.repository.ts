import type { HabitEntryDto, HabitEntryStatus } from '~~/shared/types/habits'

export interface HabitEntryRepository {
  findManyForHabit(userId: string, habitId: string, options: { from?: string; to?: string; cursor?: string; limit: number }): Promise<{ entries: HabitEntryDto[]; nextCursor: string | null }>
  upsert(input: {
    habitId: string
    date: string
    value: number | null
    status: HabitEntryStatus
    note: string | null
  }): Promise<HabitEntryDto>
}
