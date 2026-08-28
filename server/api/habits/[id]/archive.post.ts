import type { HabitResponse } from '~~/shared/contracts/habits'
import { habitIdParamsSchema } from '~~/shared/schemas/habits'
import { habitService } from '../../../services/habits/habit.service'
import { requireSessionUser } from '../../../utils/session'
import { toHttpError } from '../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)

  try {
    return { habit: await habitService.archiveHabit(user.id, id) } satisfies HabitResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
