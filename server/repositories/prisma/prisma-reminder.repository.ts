import type { ReminderCreateInput, ReminderUpdateInput } from '~~/shared/schemas/reminders'
import type { HabitReminderDto } from '~~/shared/types/reminders'
import type { HabitReminder as PrismaHabitReminder } from '../../generated/prisma/client'
import { usePrisma } from '../../utils/prisma'
import type { ReminderRepository } from '../reminder.repository'

function mapReminder(reminder: PrismaHabitReminder & { habit: { title: string } }): HabitReminderDto {
  return {
    id: reminder.id,
    habitId: reminder.habitId,
    habitTitle: reminder.habit.title,
    time: reminder.time,
    timezone: reminder.timezone,
    enabled: reminder.enabled,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString()
  }
}

const includeHabit = { habit: { select: { title: true } } } as const

export class PrismaReminderRepository implements ReminderRepository {
  async findManyByUserId(userId: string, habitId?: string): Promise<HabitReminderDto[]> {
    const reminders = await usePrisma().habitReminder.findMany({
      where: { habit: { userId }, ...(habitId ? { habitId } : {}) },
      include: includeHabit,
      orderBy: [{ time: 'asc' }, { createdAt: 'asc' }]
    })
    return reminders.map(mapReminder)
  }

  async findByIdForUser(userId: string, reminderId: string): Promise<HabitReminderDto | null> {
    const reminder = await usePrisma().habitReminder.findFirst({ where: { id: reminderId, habit: { userId } }, include: includeHabit })
    return reminder ? mapReminder(reminder) : null
  }

  async create(habitId: string, input: ReminderCreateInput): Promise<HabitReminderDto> {
    return mapReminder(await usePrisma().habitReminder.create({ data: { habitId, ...input }, include: includeHabit }))
  }

  async update(userId: string, reminderId: string, input: ReminderUpdateInput): Promise<HabitReminderDto> {
    return mapReminder(await usePrisma().habitReminder.update({ where: { id: reminderId, habit: { userId } }, data: input, include: includeHabit }))
  }

  async delete(userId: string, reminderId: string): Promise<boolean> {
    return (await usePrisma().habitReminder.deleteMany({ where: { id: reminderId, habit: { userId } } })).count === 1
  }
}

export const reminderRepository: ReminderRepository = new PrismaReminderRepository()
