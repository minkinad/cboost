import type { HabitResponse } from '~~/shared/contracts/habits'
import { habitIdParamsSchema } from '~~/shared/schemas/habits'
import { habitService } from '../../services/habits/habit.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'
import { getDateKeyInTimeZone, lastDateKeys } from '~~/shared/utils/dates'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)

  try {
    const today = getDateKeyInTimeZone(new Date(), user.timezone)
    return { habit: await habitService.getHabitForDisplay(user.id, id, { from: lastDateKeys(120, today)[0], to: today }) } satisfies HabitResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
