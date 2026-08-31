import type { RemindersResponse } from '~~/shared/contracts/reminders'
import { reminderListQuerySchema } from '~~/shared/schemas/reminders'
import { reminderService } from '../../services/reminders/reminder.service'
import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const query = await getValidatedQuery(event, reminderListQuerySchema.parse)
  return { reminders: await reminderService.list(user.id, query.habitId) } satisfies RemindersResponse
})
