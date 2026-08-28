import type { HabitEntryPutInput } from '~~/shared/schemas/habits'
import type { HabitDto, HabitEntryDto } from '~~/shared/types/habits'
import { DomainRuleError, resolveEntryState } from '../../domain/habits/entry-rules'
import { isScheduledOnDate } from '../../domain/habits/schedule-rules'
import { ApplicationError } from '../../domain/errors'
import type { HabitEntryRepository } from '../../repositories/habit-entry.repository'
import type { HabitRepository } from '../../repositories/habit.repository'
import { habitEntryRepository } from '../../repositories/prisma/prisma-habit-entry.repository'
import { habitRepository } from '../../repositories/prisma/prisma-habit.repository'

export class HabitEntryService {
  constructor(
    private readonly habits: HabitRepository,
    private readonly entries: HabitEntryRepository
  ) {}

  async listEntries(userId: string, habitId: string): Promise<HabitEntryDto[]> {
    await this.requireHabit(userId, habitId)
    return this.entries.findManyForHabit(userId, habitId)
  }

  async putEntry(
    userId: string,
    habitId: string,
    date: string,
    input: HabitEntryPutInput
  ): Promise<HabitEntryDto> {
    const habit = await this.requireHabit(userId, habitId)

    if (habit.archivedAt) {
      throw new ApplicationError('Нельзя изменять записи архивной привычки', 409)
    }

    if (!isScheduledOnDate(habit.schedule, date)) {
      throw new ApplicationError('Привычка не запланирована на выбранную дату', 422)
    }

    try {
      const state = resolveEntryState(habit.trackingType, habit.targetValue, input)
      return this.entries.upsert({
        habitId,
        date,
        ...state,
        note: input.note ?? null
      })
    } catch (error) {
      if (error instanceof DomainRuleError) {
        throw new ApplicationError(error.message, 422)
      }
      throw error
    }
  }

  private async requireHabit(userId: string, habitId: string): Promise<HabitDto> {
    const habit = await this.habits.findByIdForUser(userId, habitId)

    if (!habit) {
      throw new ApplicationError('Привычка не найдена', 404)
    }

    return habit
  }
}

export const habitEntryService = new HabitEntryService(habitRepository, habitEntryRepository)
