import type { HabitEntryStatus } from './habits'

export interface PeriodAnalytics {
  startDate: string
  endDate: string
  completed: number
  partial: number
  skipped: number
  missed: number
  pending: number
  expected: number
  rate: number
}

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4 | 5

export interface HeatmapDay {
  date: string
  completed: number
  expected: number
  rate: number
  intensity: HeatmapIntensity
}

export interface WeekdayAnalytics {
  weekday: number
  label: string
  completed: number
  expected: number
  rate: number
}

export interface NumericHabitAnalytics {
  averageValue: number
  averageTargetAchievement: number
  bestDay: { date: string; value: number; achievement: number } | null
}

export interface HabitAnalyticsDto {
  habitId: string
  title: string
  currentStreak: number
  bestStreak: number
  completion7Days: number
  completion30Days: number
  completion90Days: number
  history30Days: Array<{ date: string; status: HabitEntryStatus | null }>
  numeric: NumericHabitAnalytics | null
}

export interface GoalProgressDto {
  goalId: string
  title: string
  progress: number
  habits: Array<{ habitId: string; title: string; weight: number; completionRate: number }>
}

export interface WeeklyReviewDto {
  overall: number
  changePercentagePoints: number
  strongestHabits: Array<{ habitId: string; title: string; rate: number }>
  needsAttention: Array<{ habitId: string; title: string; rate: number }>
  pattern: { habitId: string; weekday: number; weekdayLabel: string; rate: number; statement: string } | null
  longestStreak: { habitId: string; title: string; streak: number } | null
}

export interface AnalyticsOverviewResponse {
  today: string
  currentWeek: PeriodAnalytics
  previousWeek: PeriodAnalytics
  changePercentagePoints: number
  statusTotals: Record<Extract<HabitEntryStatus, 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'MISSED'>, number>
  heatmap: HeatmapDay[]
  weekdays: WeekdayAnalytics[]
  habits: HabitAnalyticsDto[]
  goals: GoalProgressDto[]
  weeklyReview: WeeklyReviewDto
}
