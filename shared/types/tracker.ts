export type HabitFrequency = 'daily' | 'weekly'

export interface Habit {
  id: string
  title: string
  description: string
  frequency: HabitFrequency
  target: number
  unit: string
  color: string
  createdAt: string
  completions: string[]
}

export interface HabitCreateInput {
  title: string
  description?: string
  frequency: HabitFrequency
  target: number
  unit: string
  color: string
}

export interface TrackerState {
  habits: Habit[]
  updatedAt: string
}

export interface DailySeriesPoint {
  date: string
  expected: number
  completed: number
}

export interface TrackerStats {
  weekCompletionRate: number
  monthCompletionRate: number
  weekCompleted: number
  weekExpected: number
  monthCompleted: number
  monthExpected: number
  perfectDayStreak: number
  bestHabit: {
    id: string
    title: string
    currentStreak: number
    bestStreak: number
  } | null
  dailySeries: DailySeriesPoint[]
}

export interface HabitDayView {
  date: string
  scheduled: boolean
  status: import('./habits').HabitEntryStatus | null
}

export interface HabitListItemView {
  id: string
  title: string
  description: string
  color: string
  trackingType: import('./habits').TrackingType
  targetValue: number | null
  unit: string
  currentValue: number | null
  step: number
  status: import('./habits').HabitEntryStatus | null
  scheduledToday: boolean
  scheduleLabel: string
  createdLabel: string
  currentStreak: number
  bestStreak: number
  recentDays: HabitDayView[]
}
