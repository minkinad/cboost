import type { CategoryResponse } from '~~/shared/contracts/organization'
import { categoryCreateInputSchema } from '~~/shared/schemas/organization'
import { categoryService } from '../../services/categories/category.service'
import { requireSessionUser } from '../../utils/session'
import { toHttpError } from '../../utils/http-errors'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const input = await readValidatedBody(event, categoryCreateInputSchema.parse)
  try {
    const category = await categoryService.create(user.id, input)
    setResponseStatus(event, 201)
    return { category } satisfies CategoryResponse
  } catch (error) {
    throw toHttpError(error)
  }
})
