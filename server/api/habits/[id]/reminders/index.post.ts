import type { ReminderResponse } from '~~/shared/contracts/reminders'
import { habitIdParamsSchema } from '~~/shared/schemas/habits'
import { reminderCreateInputSchema } from '~~/shared/schemas/reminders'
import { reminderService } from '../../../../services/reminders/reminder.service'
import { requireSessionUser } from '../../../../utils/session'
import { toHttpError } from '../../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)
  const input = await readValidatedBody(event, reminderCreateInputSchema.parse)
  try {
    const reminder = await reminderService.create(user.id, id, input)
    setResponseStatus(event, 201)
    return { reminder } satisfies ReminderResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
