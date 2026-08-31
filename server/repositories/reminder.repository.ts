import type { ReminderCreateInput, ReminderUpdateInput } from '~~/shared/schemas/reminders'
import type { HabitReminderDto } from '~~/shared/types/reminders'

export interface ReminderRepository {
  findManyByUserId(userId: string, habitId?: string): Promise<HabitReminderDto[]>
  findByIdForUser(userId: string, reminderId: string): Promise<HabitReminderDto | null>
  create(habitId: string, input: ReminderCreateInput): Promise<HabitReminderDto>
  update(userId: string, reminderId: string, input: ReminderUpdateInput): Promise<HabitReminderDto>
  delete(userId: string, reminderId: string): Promise<boolean>
}
