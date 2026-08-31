import { reminderIdParamsSchema } from '~~/shared/schemas/reminders'
import { reminderService } from '../../services/reminders/reminder.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, reminderIdParamsSchema.parse)
  try {
    await reminderService.delete(user.id, id)
    setResponseStatus(event, 204)
  } catch (error) {
    throw toHttpError(error)
  }
})
