import type { SessionUser } from '~~/shared/types/auth'
import type { HabitDto, HabitEntryDto, HabitScheduleDto } from '~~/shared/types/habits'
import type { CategoryDto, GoalDto } from '~~/shared/types/organization'
import { databaseDateToDateKey } from '~~/shared/utils/dates'
import type {
  Habit as PrismaHabit,
  HabitEntry as PrismaHabitEntry,
  HabitSchedule as PrismaHabitSchedule,
  Category as PrismaCategory,
  Goal as PrismaGoal,
  GoalHabit as PrismaGoalHabit,
  User as PrismaUser
} from '../../generated/prisma/client'
import type { UserRecord } from '../user.repository'

export function mapUser(user: PrismaUser): UserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone
  }
}

export function mapSchedule(schedule: PrismaHabitSchedule): HabitScheduleDto {
  return {
    id: schedule.id,
    type: schedule.type,
    weekdays: schedule.weekdays,
    timesPerWeek: schedule.timesPerWeek,
    intervalDays: schedule.intervalDays,
    startDate: databaseDateToDateKey(schedule.startDate),
    endDate: schedule.endDate ? databaseDateToDateKey(schedule.endDate) : null
  }
}

export function mapEntry(entry: PrismaHabitEntry): HabitEntryDto {
  return {
    id: entry.id,
    habitId: entry.habitId,
    date: databaseDateToDateKey(entry.date),
    value: entry.value == null ? null : Number(entry.value),
    status: entry.status,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  }
}

export function mapHabit(
  habit: PrismaHabit & { schedule: PrismaHabitSchedule | null; entries?: PrismaHabitEntry[] }
): HabitDto {
  if (!habit.schedule) {
    throw new Error(`Habit ${habit.id} has no schedule`)
  }

  return {
    id: habit.id,
    categoryId: habit.categoryId,
    title: habit.title,
    description: habit.description,
    trackingType: habit.trackingType,
    targetValue: habit.targetValue == null ? null : Number(habit.targetValue),
    unit: habit.unit,
    color: habit.color,
    icon: habit.icon,
    archivedAt: habit.archivedAt?.toISOString() ?? null,
    schedule: mapSchedule(habit.schedule),
    entries: habit.entries?.map(mapEntry),
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString()
  }
}

export function mapCategory(category: PrismaCategory): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    createdAt: category.createdAt.toISOString()
  }
}

export function mapGoal(
  goal: PrismaGoal & { habitLinks: Array<PrismaGoalHabit & { habit: PrismaHabit }> }
): GoalDto {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    targetDate: goal.targetDate ? databaseDateToDateKey(goal.targetDate) : null,
    status: goal.status,
    habits: goal.habitLinks.map((link) => ({
      habitId: link.habitId,
      weight: Number(link.weight),
      habit: {
        id: link.habit.id,
        title: link.habit.title,
        color: link.habit.color,
        icon: link.habit.icon,
        trackingType: link.habit.trackingType
      }
    })),
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString()
  }
}
