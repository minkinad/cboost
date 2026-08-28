import type { HabitEntriesResponse } from '~~/shared/contracts/habits'
import { habitIdParamsSchema } from '~~/shared/schemas/habits'
import { habitEntryService } from '../../../../services/habits/habit-entry.service'
import { requireSessionUser } from '../../../../utils/session'
import { toHttpError } from '../../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)

  try {
    const entries = await habitEntryService.listEntries(user.id, id)
    return { entries } satisfies HabitEntriesResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
