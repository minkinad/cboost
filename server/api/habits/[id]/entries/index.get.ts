import type { HabitEntriesResponse } from '~~/shared/contracts/habits'
import { habitEntriesQuerySchema, habitIdParamsSchema } from '~~/shared/schemas/habits'
import { habitEntryService } from '../../../../services/habits/habit-entry.service'
import { requireSessionUser } from '../../../../utils/session'
import { toHttpError } from '../../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)
  const query = await getValidatedQuery(event, habitEntriesQuerySchema.parse)

  try {
    return await habitEntryService.listEntries(user.id, id, query) satisfies HabitEntriesResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
