import type { AnalyticsOverviewResponse } from '~~/shared/contracts/analytics'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { analyticsService } from '../../services/analytics/analytics.service'
import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const today = getDateKeyInTimeZone(new Date(), user.timezone)
  return await analyticsService.overview(user.id, today) satisfies AnalyticsOverviewResponse
})
