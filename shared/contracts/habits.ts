import type { HabitDto, HabitEntryDto } from '../types/habits'

export interface HabitsResponse {
  habits: HabitDto[]
}

export interface HabitResponse {
  habit: HabitDto
}

export interface HabitEntriesResponse {
  entries: HabitEntryDto[]
  nextCursor: string | null
}

export interface HabitEntryResponse {
  entry: HabitEntryDto
}

export interface LegacyImportResponse {
  importedHabits: number
  importedEntries: number
  skippedHabits: number
}
