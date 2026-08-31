import type { ReminderCreateInput, ReminderUpdateInput } from '~~/shared/schemas/reminders'
import type { HabitReminderDto } from '~~/shared/types/reminders'
import { ApplicationError } from '../../domain/errors'
import type { HabitRepository } from '../../repositories/habit.repository'
import type { ReminderRepository } from '../../repositories/reminder.repository'
import { habitRepository } from '../../repositories/prisma/prisma-habit.repository'
import { reminderRepository } from '../../repositories/prisma/prisma-reminder.repository'

export class ReminderService {
  constructor(private readonly reminders: ReminderRepository, private readonly habits: HabitRepository) {}

  list(userId: string, habitId?: string): Promise<HabitReminderDto[]> {
    return this.reminders.findManyByUserId(userId, habitId)
  }

  async create(userId: string, habitId: string, input: ReminderCreateInput): Promise<HabitReminderDto> {
    if (!await this.habits.findByIdForUser(userId, habitId)) throw new ApplicationError('Привычка не найдена', 404)
    return this.reminders.create(habitId, input)
  }

  async update(userId: string, reminderId: string, input: ReminderUpdateInput): Promise<HabitReminderDto> {
    if (!await this.reminders.findByIdForUser(userId, reminderId)) throw new ApplicationError('Напоминание не найдено', 404)
    return this.reminders.update(userId, reminderId, input)
  }

  async delete(userId: string, reminderId: string): Promise<void> {
    if (!await this.reminders.delete(userId, reminderId)) throw new ApplicationError('Напоминание не найдено', 404)
  }
}

export const reminderService = new ReminderService(reminderRepository, habitRepository)
