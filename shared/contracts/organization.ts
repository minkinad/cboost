import type { CategoryDto, GoalDto } from '../types/organization'

export interface CategoriesResponse { categories: CategoryDto[] }
export interface CategoryResponse { category: CategoryDto }
export interface GoalsResponse { goals: GoalDto[] }
export interface GoalResponse { goal: GoalDto }
