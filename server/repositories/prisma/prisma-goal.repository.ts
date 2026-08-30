import type { GoalCreateInput, GoalUpdateInput } from '~~/shared/schemas/organization'
import type { GoalDto } from '~~/shared/types/organization'
import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'
import { usePrisma } from '../../utils/prisma'
import type { GoalRepository } from '../goal.repository'
import { mapGoal } from './mappers'

const goalInclude = { habitLinks: { include: { habit: true }, orderBy: { habitId: 'asc' as const } } } as const

function goalData(input: GoalCreateInput | GoalUpdateInput) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.targetDate !== undefined ? { targetDate: input.targetDate ? dateKeyToDatabaseDate(input.targetDate) : null } : {}),
    ...(input.status !== undefined ? { status: input.status } : {})
  }
}

export class PrismaGoalRepository implements GoalRepository {
  async findManyByUserId(userId: string): Promise<GoalDto[]> {
    const goals = await usePrisma().goal.findMany({ where: { userId }, include: goalInclude, orderBy: { createdAt: 'desc' } })
    return goals.map(mapGoal)
  }

  async findByIdForUser(userId: string, goalId: string): Promise<GoalDto | null> {
    const goal = await usePrisma().goal.findFirst({ where: { id: goalId, userId }, include: goalInclude })
    return goal ? mapGoal(goal) : null
  }

  async findOwnedHabitIds(userId: string, habitIds: string[]): Promise<string[]> {
    if (!habitIds.length) return []
    const habits = await usePrisma().habit.findMany({ where: { userId, id: { in: habitIds } }, select: { id: true } })
    return habits.map((habit) => habit.id)
  }

  async create(userId: string, input: GoalCreateInput): Promise<GoalDto> {
    const goal = await usePrisma().goal.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        targetDate: input.targetDate ? dateKeyToDatabaseDate(input.targetDate) : null,
        status: input.status,
        habitLinks: { create: input.habits.map((habit) => ({ habitId: habit.habitId, weight: habit.weight })) }
      },
      include: goalInclude
    })
    return mapGoal(goal)
  }

  async update(userId: string, goalId: string, input: GoalUpdateInput): Promise<GoalDto> {
    const goal = await usePrisma().goal.update({
      where: { id: goalId, userId },
      data: {
        ...goalData(input),
        ...(input.habits ? { habitLinks: { deleteMany: {}, create: input.habits.map((habit) => ({ habitId: habit.habitId, weight: habit.weight })) } } : {})
      },
      include: goalInclude
    })
    return mapGoal(goal)
  }

  async delete(userId: string, goalId: string): Promise<boolean> {
    return (await usePrisma().goal.deleteMany({ where: { id: goalId, userId } })).count === 1
  }
}

export const goalRepository: GoalRepository = new PrismaGoalRepository()
