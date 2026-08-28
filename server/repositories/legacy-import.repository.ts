import type { LegacyHabitImportRecord } from '../domain/habits/legacy-mapping'

export interface LegacyImportResult {
  importedHabits: number
  importedEntries: number
  skippedHabits: number
}

export interface LegacyImportRepository {
  import(userId: string, records: LegacyHabitImportRecord[]): Promise<LegacyImportResult>
}
