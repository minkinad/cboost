import type { HabitCreateInput, HabitScheduleInput } from '~~/shared/schemas/habits'
import type { HabitDto } from '~~/shared/types/habits'
import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'
import { usePrisma } from '../../utils/prisma'
import type { HabitRepository } from '../habit.repository'
import { mapHabit } from './mappers'

function scheduleData(schedule: HabitScheduleInput) {
  return {
    type: schedule.type,
    weekdays: schedule.weekdays,
    timesPerWeek: schedule.timesPerWeek ?? null,
    intervalDays: schedule.intervalDays ?? null,
    startDate: dateKeyToDatabaseDate(schedule.startDate),
    endDate: schedule.endDate ? dateKeyToDatabaseDate(schedule.endDate) : null
  }
}

function habitData(input: HabitCreateInput) {
  return {
    title: input.title,
    description: input.description,
    trackingType: input.trackingType,
    targetValue: input.targetValue,
    unit: input.unit,
    color: input.color,
    icon: input.icon,
    categoryId: input.categoryId ?? null
  }
}

const habitInclude = {
  schedule: true,
  entries: { orderBy: { date: 'asc' as const } }
} as const

export class PrismaHabitRepository implements HabitRepository {
  async categoryBelongsToUser(userId: string, categoryId: string): Promise<boolean> {
    return (await usePrisma().category.count({ where: { id: categoryId, userId } })) === 1
  }
  async findManyByUserId(userId: string, includeArchived = false): Promise<HabitDto[]> {
    const habits = await usePrisma().habit.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      include: habitInclude,
      orderBy: { createdAt: 'desc' }
    })
    return habits.map(mapHabit)
  }

  async findByIdForUser(userId: string, habitId: string): Promise<HabitDto | null> {
    const habit = await usePrisma().habit.findFirst({
      where: { id: habitId, userId },
      include: habitInclude
    })
    return habit ? mapHabit(habit) : null
  }

  async create(userId: string, input: HabitCreateInput): Promise<HabitDto> {
    const habit = await usePrisma().habit.create({
      data: {
        userId,
        ...habitData(input),
        schedule: { create: scheduleData(input.schedule) }
      },
      include: habitInclude
    })
    return mapHabit(habit)
  }

  async update(userId: string, habitId: string, input: HabitCreateInput): Promise<HabitDto> {
    const habit = await usePrisma().habit.update({
      where: { id: habitId, userId },
      data: {
        ...habitData(input),
        ...(input.schedule
          ? {
              schedule: {
                upsert: {
                  create: scheduleData(input.schedule),
                  update: scheduleData(input.schedule)
                }
              }
            }
          : {})
      },
      include: habitInclude
    })
    return mapHabit(habit)
  }

  async replaceSchedule(userId: string, habitId: string, input: HabitScheduleInput): Promise<HabitDto> {
    const current = await this.findByIdForUser(userId, habitId)

    if (!current) {
      throw new Error('Habit not found')
    }

    return this.update(userId, habitId, {
      title: current.title,
      description: current.description,
      trackingType: current.trackingType,
      targetValue: current.targetValue,
      unit: current.unit,
      color: current.color,
      icon: current.icon,
      categoryId: current.categoryId,
      schedule: input
    })
  }

  async archive(userId: string, habitId: string): Promise<HabitDto> {
    const habit = await usePrisma().habit.update({
      where: { id: habitId, userId },
      data: { archivedAt: new Date() },
      include: habitInclude
    })
    return mapHabit(habit)
  }

  async restore(userId: string, habitId: string): Promise<HabitDto> {
    const habit = await usePrisma().habit.update({
      where: { id: habitId, userId },
      data: { archivedAt: null },
      include: habitInclude
    })
    return mapHabit(habit)
  }

  async delete(userId: string, habitId: string): Promise<boolean> {
    const result = await usePrisma().habit.deleteMany({ where: { id: habitId, userId } })
    return result.count === 1
  }
}

export const habitRepository: HabitRepository = new PrismaHabitRepository()
