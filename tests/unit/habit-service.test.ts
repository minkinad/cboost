import { describe, expect, it } from 'vitest'
import type { HabitCreateInput, HabitScheduleInput } from '../../shared/schemas/habits'
import type { HabitDto } from '../../shared/types/habits'
import type { ApplicationError } from '../../server/domain/errors'
import type { HabitRepository } from '../../server/repositories/habit.repository'
import { HabitService } from '../../server/services/habits/habit.service'

class InMemoryHabitRepository implements HabitRepository {
  constructor(private habits: Array<HabitDto & { userId: string }>) {}

  async findManyByUserId(userId: string): Promise<HabitDto[]> {
    return this.habits.filter((habit) => habit.userId === userId)
  }

  async findByIdForUser(userId: string, habitId: string): Promise<HabitDto | null> {
    return this.habits.find((habit) => habit.userId === userId && habit.id === habitId) ?? null
  }

  async create(userId: string, input: HabitCreateInput): Promise<HabitDto> {
    const habit = makeHabit(userId, input.title)
    this.habits.unshift(habit)
    return habit
  }

  async update(userId: string, habitId: string, input: HabitCreateInput): Promise<HabitDto> {
    const current = await this.findByIdForUser(userId, habitId)
    if (!current) throw new Error('missing')
    return { ...current, ...input, description: input.description ?? null, targetValue: input.targetValue ?? null }
  }

  async replaceSchedule(userId: string, habitId: string, input: HabitScheduleInput): Promise<HabitDto> {
    const current = await this.findByIdForUser(userId, habitId)
    if (!current) throw new Error('missing')
    return { ...current, schedule: { ...current.schedule, ...input, timesPerWeek: input.timesPerWeek ?? null, intervalDays: input.intervalDays ?? null, endDate: input.endDate ?? null } }
  }

  async archive(userId: string, habitId: string): Promise<HabitDto> {
    const current = await this.findByIdForUser(userId, habitId)
    if (!current) throw new Error('missing')
    return { ...current, archivedAt: new Date().toISOString() }
  }

  async delete(userId: string, habitId: string): Promise<boolean> {
    const index = this.habits.findIndex((habit) => habit.userId === userId && habit.id === habitId)
    if (index < 0) return false
    this.habits.splice(index, 1)
    return true
  }
}

function makeHabit(userId = 'user-1', title = 'Чтение'): HabitDto & { userId: string } {
  return {
    userId,
    id: `${userId}-habit`,
    title,
    description: null,
    trackingType: 'BOOLEAN',
    targetValue: null,
    unit: null,
    color: '#ff5c3d',
    icon: null,
    archivedAt: null,
    schedule: {
      id: 'schedule-1',
      type: 'EVERY_DAY',
      weekdays: [],
      timesPerWeek: null,
      intervalDays: null,
      startDate: '2026-08-01',
      endDate: null
    },
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  }
}

describe('HabitService', () => {
  it('returns only habits owned by the current user', async () => {
    const service = new HabitService(new InMemoryHabitRepository([makeHabit('user-1'), makeHabit('user-2')]))
    const habits = await service.listHabits('user-1')
    expect(habits).toHaveLength(1)
    expect(habits[0]?.id).toBe('user-1-habit')
  })

  it('hides another user habit behind not-found', async () => {
    const service = new HabitService(new InMemoryHabitRepository([makeHabit('owner')]))
    await expect(service.getHabit('attacker', 'owner-habit')).rejects.toMatchObject<ApplicationError>({ statusCode: 404 })
  })
})
