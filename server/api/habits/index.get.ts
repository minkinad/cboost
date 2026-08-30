import type { HabitsResponse } from '~~/shared/contracts/habits'
import { habitService } from '../../services/habits/habit.service'
import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const query = getQuery(event)
  const habits = await habitService.listHabits(user.id, query.includeArchived === 'true')
  return { habits } satisfies HabitsResponse
})
