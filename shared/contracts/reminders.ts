import type { HabitReminderDto } from '../types/reminders'

export interface RemindersResponse { reminders: HabitReminderDto[] }
export interface ReminderResponse { reminder: HabitReminderDto }
