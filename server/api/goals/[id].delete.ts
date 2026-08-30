import { entityIdParamsSchema } from '~~/shared/schemas/organization'
import { goalService } from '../../services/goals/goal.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, entityIdParamsSchema.parse)
  try {
    await goalService.delete(user.id, id)
    setResponseStatus(event, 204)
  } catch (error) {
    throw toHttpError(error)
  }
})
