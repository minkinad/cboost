import type { GoalCreateInput, GoalUpdateInput } from '~~/shared/schemas/organization'
import type { GoalDto } from '~~/shared/types/organization'

export interface GoalRepository {
  findManyByUserId(userId: string): Promise<GoalDto[]>
  findByIdForUser(userId: string, goalId: string): Promise<GoalDto | null>
  findOwnedHabitIds(userId: string, habitIds: string[]): Promise<string[]>
  create(userId: string, input: GoalCreateInput): Promise<GoalDto>
  update(userId: string, goalId: string, input: GoalUpdateInput): Promise<GoalDto>
  delete(userId: string, goalId: string): Promise<boolean>
}
