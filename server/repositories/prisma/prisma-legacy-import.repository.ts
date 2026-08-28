import { dateKeyToDatabaseDate } from '~~/shared/utils/dates'
import { usePrisma } from '../../utils/prisma'
import type { LegacyImportRepository, LegacyImportResult } from '../legacy-import.repository'

export class PrismaLegacyImportRepository implements LegacyImportRepository {
  async import(
    userId: string,
    records: Parameters<LegacyImportRepository['import']>[1]
  ): Promise<LegacyImportResult> {
    return usePrisma().$transaction(async (transaction) => {
      let importedHabits = 0
      let importedEntries = 0
      let skippedHabits = 0

      for (const record of records) {
        const created = await transaction.habit.createMany({
          data: {
            userId,
            legacySourceId: record.legacySourceId,
            title: record.title,
            description: record.description,
            trackingType: record.trackingType,
            targetValue: record.targetValue,
            unit: record.unit,
            color: record.color,
            createdAt: record.createdAt
          },
          skipDuplicates: true
        })

        const habit = await transaction.habit.findUniqueOrThrow({
          where: {
            userId_legacySourceId: {
              userId,
              legacySourceId: record.legacySourceId
            }
          }
        })

        if (created.count === 1) {
          await transaction.habitSchedule.create({
            data: {
              habitId: habit.id,
              type: record.schedule.type,
              weekdays: record.schedule.weekdays,
              startDate: dateKeyToDatabaseDate(record.schedule.startDate)
            }
          })
          importedHabits += 1
        } else {
          skippedHabits += 1
        }

        const entries = await transaction.habitEntry.createMany({
          data: record.entries.map((entry) => ({
            habitId: habit.id,
            date: dateKeyToDatabaseDate(entry.date),
            value: entry.value,
            status: 'COMPLETED' as const
          })),
          skipDuplicates: true
        })
        importedEntries += entries.count
      }

      return { importedHabits, importedEntries, skippedHabits }
    })
  }
}

export const legacyImportRepository: LegacyImportRepository = new PrismaLegacyImportRepository()
