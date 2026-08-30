import type { CategoryResponse } from '~~/shared/contracts/organization'
import { categoryUpdateInputSchema, entityIdParamsSchema } from '~~/shared/schemas/organization'
import { categoryService } from '../../services/categories/category.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { id } = await getValidatedRouterParams(event, entityIdParamsSchema.parse)
  const input = await readValidatedBody(event, categoryUpdateInputSchema.parse)
  try {
    return { category: await categoryService.update(user.id, id, input) } satisfies CategoryResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
