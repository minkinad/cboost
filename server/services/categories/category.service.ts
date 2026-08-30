import type { CategoryCreateInput, CategoryUpdateInput } from '~~/shared/schemas/organization'
import type { CategoryDto } from '~~/shared/types/organization'
import { ApplicationError } from '../../domain/errors'
import type { CategoryRepository } from '../../repositories/category.repository'
import { categoryRepository } from '../../repositories/prisma/prisma-category.repository'

export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  list(userId: string): Promise<CategoryDto[]> {
    return this.repository.findManyByUserId(userId)
  }

  create(userId: string, input: CategoryCreateInput): Promise<CategoryDto> {
    return this.repository.create(userId, input)
  }

  async update(userId: string, categoryId: string, input: CategoryUpdateInput): Promise<CategoryDto> {
    if (!await this.repository.findByIdForUser(userId, categoryId)) throw new ApplicationError('Категория не найдена', 404)
    return this.repository.update(userId, categoryId, input)
  }

  async delete(userId: string, categoryId: string): Promise<void> {
    if (!await this.repository.delete(userId, categoryId)) throw new ApplicationError('Категория не найдена', 404)
  }
}

export const categoryService = new CategoryService(categoryRepository)
