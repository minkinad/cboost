import type { CategoriesResponse } from '~~/shared/contracts/organization'
import { categoryService } from '../../services/categories/category.service'
import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  return { categories: await categoryService.list(user.id) } satisfies CategoriesResponse
})
