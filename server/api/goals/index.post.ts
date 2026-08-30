import type { GoalResponse } from '~~/shared/contracts/organization'
import { goalCreateInputSchema } from '~~/shared/schemas/organization'
import { goalService } from '../../services/goals/goal.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const input = await readValidatedBody(event, goalCreateInputSchema.parse)
  try {
    const goal = await goalService.create(user.id, input)
    setResponseStatus(event, 201)
    return { goal } satisfies GoalResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
