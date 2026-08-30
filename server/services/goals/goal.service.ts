import type { GoalCreateInput, GoalUpdateInput } from '~~/shared/schemas/organization'
import type { GoalDto } from '~~/shared/types/organization'
import { ApplicationError } from '../../domain/errors'
import type { GoalRepository } from '../../repositories/goal.repository'
import { goalRepository } from '../../repositories/prisma/prisma-goal.repository'

export class GoalService {
  constructor(private readonly repository: GoalRepository) {}

  list(userId: string): Promise<GoalDto[]> {
    return this.repository.findManyByUserId(userId)
  }

  async get(userId: string, goalId: string): Promise<GoalDto> {
    const goal = await this.repository.findByIdForUser(userId, goalId)
    if (!goal) throw new ApplicationError('Цель не найдена', 404)
    return goal
  }

  private async assertHabitOwnership(userId: string, habitIds: string[]): Promise<void> {
    const owned = await this.repository.findOwnedHabitIds(userId, habitIds)
    if (owned.length !== habitIds.length) throw new ApplicationError('Одна или несколько привычек не найдены', 404)
  }

  async create(userId: string, input: GoalCreateInput): Promise<GoalDto> {
    await this.assertHabitOwnership(userId, input.habits.map((habit) => habit.habitId))
    return this.repository.create(userId, input)
  }

  async update(userId: string, goalId: string, input: GoalUpdateInput): Promise<GoalDto> {
    await this.get(userId, goalId)
    if (input.habits) await this.assertHabitOwnership(userId, input.habits.map((habit) => habit.habitId))
    return this.repository.update(userId, goalId, input)
  }

  async delete(userId: string, goalId: string): Promise<void> {
    if (!await this.repository.delete(userId, goalId)) throw new ApplicationError('Цель не найдена', 404)
  }
}

export const goalService = new GoalService(goalRepository)
