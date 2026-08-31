import type { HabitCreateInput, HabitScheduleInput } from '~~/shared/schemas/habits'
import type { HabitDto } from '~~/shared/types/habits'

export interface HabitRepository {
  findManyByUserId(userId: string, includeArchived?: boolean, entryRange?: { from?: string; to?: string }): Promise<HabitDto[]>
  findByIdForUser(userId: string, habitId: string, entryRange?: { from?: string; to?: string }): Promise<HabitDto | null>
  categoryBelongsToUser(userId: string, categoryId: string): Promise<boolean>
  create(userId: string, input: HabitCreateInput): Promise<HabitDto>
  update(userId: string, habitId: string, input: HabitCreateInput): Promise<HabitDto>
  replaceSchedule(userId: string, habitId: string, input: HabitScheduleInput): Promise<HabitDto>
  archive(userId: string, habitId: string): Promise<HabitDto>
  restore(userId: string, habitId: string): Promise<HabitDto>
  delete(userId: string, habitId: string): Promise<boolean>
}
