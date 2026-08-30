import type { HabitAnalyticsResponse } from '~~/shared/contracts/analytics'
import { habitIdParamsSchema } from '~~/shared/schemas/habits'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { analyticsService } from '../../../services/analytics/analytics.service'
import { requireSessionUser } from '../../../utils/session'
import { toHttpError } from '../../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, habitIdParamsSchema.parse)
  try {
    return {
      analytics: await analyticsService.habit(user.id, id, getDateKeyInTimeZone(new Date(), user.timezone))
    } satisfies HabitAnalyticsResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
