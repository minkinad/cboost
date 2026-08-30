import type { GoalResponse } from '~~/shared/contracts/organization'
import { entityIdParamsSchema } from '~~/shared/schemas/organization'
import { goalService } from '../../services/goals/goal.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, entityIdParamsSchema.parse)
  try {
    return { goal: await goalService.get(user.id, id) } satisfies GoalResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
