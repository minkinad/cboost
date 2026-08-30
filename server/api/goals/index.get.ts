import type { GoalsResponse } from '~~/shared/contracts/organization'
import { goalService } from '../../services/goals/goal.service'
import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  return { goals: await goalService.list(user.id) } satisfies GoalsResponse
})
