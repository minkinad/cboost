import type { HabitResponse } from '~~/shared/contracts/habits'
import { habitCreateInputSchema } from '~~/shared/schemas/habits'
import { habitService } from '../../services/habits/habit.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const input = await readValidatedBody(event, habitCreateInputSchema.parse)

  try {
    const habit = await habitService.createHabit(user.id, input)
    setResponseStatus(event, 201)
    return { habit } satisfies HabitResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
