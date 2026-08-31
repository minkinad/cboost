import type { HabitsResponse } from '~~/shared/contracts/habits'
import { habitService } from '../../services/habits/habit.service'
import { requireSessionUser } from '../../utils/session'
import { getDateKeyInTimeZone, lastDateKeys } from '~~/shared/utils/dates'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const query = getQuery(event)
  const today = getDateKeyInTimeZone(new Date(), user.timezone)
  const habits = await habitService.listHabits(user.id, query.includeArchived === 'true', { from: lastDateKeys(120, today)[0], to: today })
  return { habits } satisfies HabitsResponse
})
