import type { HabitEntryResponse } from '~~/shared/contracts/habits'
import { habitEntryParamsSchema, habitEntryPutInputSchema } from '~~/shared/schemas/habits'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { habitEntryService } from '../../../../services/habits/habit-entry.service'
import { requireSessionUser } from '../../../../utils/session'
import { toHttpError } from '../../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id, date } = await getValidatedRouterParams(event, habitEntryParamsSchema.parse)
  const input = await readValidatedBody(event, habitEntryPutInputSchema.parse)

  try {
    const userToday = getDateKeyInTimeZone(new Date(), user.timezone)
    const entry = await habitEntryService.putEntry(user.id, id, date, input, userToday)
    return { entry } satisfies HabitEntryResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
