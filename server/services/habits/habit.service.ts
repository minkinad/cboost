import {
  habitCreateInputSchema,
  type HabitCreateInput,
  type HabitUpdateInput
} from '~~/shared/schemas/habits'
import type { HabitDto } from '~~/shared/types/habits'
import { ApplicationError } from '../../domain/errors'
import type { HabitRepository } from '../../repositories/habit.repository'
import { habitRepository } from '../../repositories/prisma/prisma-habit.repository'

export class HabitService {
  constructor(private readonly repository: HabitRepository) {}

  listHabits(userId: string, includeArchived = false): Promise<HabitDto[]> {
    return this.repository.findManyByUserId(userId, includeArchived)
  }

  private async assertCategoryOwnership(userId: string, categoryId: string | null | undefined): Promise<void> {
    if (categoryId && !await this.repository.categoryBelongsToUser(userId, categoryId)) {
      throw new ApplicationError('Категория не найдена', 404)
    }
  }

  async getHabit(userId: string, habitId: string): Promise<HabitDto> {
    const habit = await this.repository.findByIdForUser(userId, habitId)

    if (!habit) {
      throw new ApplicationError('Привычка не найдена', 404)
    }

    return habit
  }

  async createHabit(userId: string, input: HabitCreateInput): Promise<HabitDto> {
    await this.assertCategoryOwnership(userId, input.categoryId)
    return this.repository.create(userId, input)
  }

  async updateHabit(userId: string, habitId: string, input: HabitUpdateInput): Promise<HabitDto> {
    const current = await this.getHabit(userId, habitId)
    await this.assertCategoryOwnership(userId, input.categoryId)
    const currentSchedule = {
      type: current.schedule.type,
      weekdays: current.schedule.weekdays,
      timesPerWeek: current.schedule.timesPerWeek,
      intervalDays: current.schedule.intervalDays,
      startDate: current.schedule.startDate,
      endDate: current.schedule.endDate
    }
    const merged = habitCreateInputSchema.safeParse({
      title: input.title ?? current.title,
      description: input.description === undefined ? current.description : input.description,
      trackingType: input.trackingType ?? current.trackingType,
      targetValue: input.targetValue === undefined ? current.targetValue : input.targetValue,
      unit: input.unit === undefined ? current.unit : input.unit,
      color: input.color === undefined ? current.color : input.color,
      icon: input.icon === undefined ? current.icon : input.icon,
      categoryId: input.categoryId === undefined ? current.categoryId : input.categoryId,
      schedule: input.schedule ?? currentSchedule
    })

    if (!merged.success) {
      throw new ApplicationError(merged.error.issues[0]?.message ?? 'Некорректное изменение привычки', 422)
    }

    return this.repository.update(userId, habitId, merged.data)
  }

  async archiveHabit(userId: string, habitId: string): Promise<HabitDto> {
    await this.getHabit(userId, habitId)
    return this.repository.archive(userId, habitId)
  }

  async restoreHabit(userId: string, habitId: string): Promise<HabitDto> {
    await this.getHabit(userId, habitId)
    return this.repository.restore(userId, habitId)
  }

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    const deleted = await this.repository.delete(userId, habitId)

    if (!deleted) {
      throw new ApplicationError('Привычка не найдена', 404)
    }
  }
}

export const habitService = new HabitService(habitRepository)
