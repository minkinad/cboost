import type { CategoryCreateInput, CategoryUpdateInput } from '~~/shared/schemas/organization'
import type { CategoryDto } from '~~/shared/types/organization'
import { usePrisma } from '../../utils/prisma'
import type { CategoryRepository } from '../category.repository'
import { mapCategory } from './mappers'

export class PrismaCategoryRepository implements CategoryRepository {
  async findManyByUserId(userId: string): Promise<CategoryDto[]> {
    const categories = await usePrisma().category.findMany({ where: { userId }, orderBy: { name: 'asc' } })
    return categories.map(mapCategory)
  }

  async findByIdForUser(userId: string, categoryId: string): Promise<CategoryDto | null> {
    const category = await usePrisma().category.findFirst({ where: { id: categoryId, userId } })
    return category ? mapCategory(category) : null
  }

  async create(userId: string, input: CategoryCreateInput): Promise<CategoryDto> {
    return mapCategory(await usePrisma().category.create({ data: { userId, ...input } }))
  }

  async update(userId: string, categoryId: string, input: CategoryUpdateInput): Promise<CategoryDto> {
    return mapCategory(await usePrisma().category.update({ where: { id: categoryId, userId }, data: input }))
  }

  async delete(userId: string, categoryId: string): Promise<boolean> {
    return (await usePrisma().category.deleteMany({ where: { id: categoryId, userId } })).count === 1
  }
}

export const categoryRepository: CategoryRepository = new PrismaCategoryRepository()
