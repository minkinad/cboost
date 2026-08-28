import type { HabitEntryDto } from '~~/shared/types/habits'
import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'
import { usePrisma } from '../../utils/prisma'
import type { HabitEntryRepository } from '../habit-entry.repository'
import { mapEntry } from './mappers'

export class PrismaHabitEntryRepository implements HabitEntryRepository {
  async findManyForHabit(userId: string, habitId: string): Promise<HabitEntryDto[]> {
    const entries = await usePrisma().habitEntry.findMany({
      where: {
        habitId,
        habit: { userId }
      },
      orderBy: { date: 'asc' }
    })
    return entries.map(mapEntry)
  }

  async upsert(input: Parameters<HabitEntryRepository['upsert']>[0]): Promise<HabitEntryDto> {
    const date = dateKeyToDatabaseDate(input.date)
    const entry = await usePrisma().habitEntry.upsert({
      where: {
        habitId_date: {
          habitId: input.habitId,
          date
        }
      },
      create: {
        habitId: input.habitId,
        date,
        value: input.value,
        status: input.status,
        note: input.note
      },
      update: {
        value: input.value,
        status: input.status,
        note: input.note
      }
    })
    return mapEntry(entry)
  }
}

export const habitEntryRepository: HabitEntryRepository = new PrismaHabitEntryRepository()
