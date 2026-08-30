import type { GoalResponse } from '~~/shared/contracts/organization'
import { entityIdParamsSchema, goalUpdateInputSchema } from '~~/shared/schemas/organization'
import { goalService } from '../../services/goals/goal.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, entityIdParamsSchema.parse)
  const input = await readValidatedBody(event, goalUpdateInputSchema.parse)
  try {
    return { goal: await goalService.update(user.id, id, input) } satisfies GoalResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
