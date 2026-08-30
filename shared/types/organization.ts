import type { HabitDto } from './habits'

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface CategoryDto {
  id: string
  name: string
  icon: string | null
  color: string | null
  createdAt: string
}

export interface GoalHabitDto {
  habitId: string
  weight: number
  habit?: Pick<HabitDto, 'id' | 'title' | 'color' | 'icon' | 'trackingType'>
}

export interface GoalDto {
  id: string
  title: string
  description: string | null
  targetDate: string | null
  status: GoalStatus
  habits: GoalHabitDto[]
  createdAt: string
  updatedAt: string
}
