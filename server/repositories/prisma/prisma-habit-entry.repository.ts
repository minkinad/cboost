import type { HabitEntryDto } from '~~/shared/types/habits'
import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'
import { usePrisma } from '../../utils/prisma'
import type { HabitEntryRepository } from '../habit-entry.repository'
import { mapEntry } from './mappers'

export class PrismaHabitEntryRepository implements HabitEntryRepository {
  async findManyForHabit(userId: string, habitId: string, options: { from?: string; to?: string; cursor?: string; limit: number }): Promise<{ entries: HabitEntryDto[]; nextCursor: string | null }> {
    const date = {
      ...(options.from ? { gte: dateKeyToDatabaseDate(options.from) } : {}),
      ...(options.to ? { lte: dateKeyToDatabaseDate(options.to) } : {}),
      ...(options.cursor ? { lt: dateKeyToDatabaseDate(options.cursor) } : {})
    }
    const entries = await usePrisma().habitEntry.findMany({
      where: {
        habitId,
        habit: { userId },
        ...(Object.keys(date).length ? { date } : {})
      },
      orderBy: { date: 'desc' },
      take: options.limit + 1
    })
    const hasMore = entries.length > options.limit
    const page = entries.slice(0, options.limit).map(mapEntry)
    return { entries: page, nextCursor: hasMore ? page.at(-1)?.date ?? null : null }
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
