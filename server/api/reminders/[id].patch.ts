import type { ReminderResponse } from '~~/shared/contracts/reminders'
import { reminderIdParamsSchema, reminderUpdateInputSchema } from '~~/shared/schemas/reminders'
import { reminderService } from '../../services/reminders/reminder.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, reminderIdParamsSchema.parse)
  const input = await readValidatedBody(event, reminderUpdateInputSchema.parse)
  try {
    return { reminder: await reminderService.update(user.id, id, input) } satisfies ReminderResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
