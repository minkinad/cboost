import type { CategoryCreateInput, CategoryUpdateInput } from '~~/shared/schemas/organization'
import type { CategoryDto } from '~~/shared/types/organization'

export interface CategoryRepository {
  findManyByUserId(userId: string): Promise<CategoryDto[]>
  findByIdForUser(userId: string, categoryId: string): Promise<CategoryDto | null>
  create(userId: string, input: CategoryCreateInput): Promise<CategoryDto>
  update(userId: string, categoryId: string, input: CategoryUpdateInput): Promise<CategoryDto>
  delete(userId: string, categoryId: string): Promise<boolean>
}
