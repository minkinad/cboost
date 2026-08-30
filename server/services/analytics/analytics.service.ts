import type { AnalyticsOverviewResponse, HabitAnalyticsDto } from '~~/shared/types/analytics'
import {
  calculateGoalProgress,
  calculateHabitAnalytics,
  calculateHeatmap,
  calculateWeekdayAnalytics,
  calculateWeeklyReview,
  currentAndPreviousWeek
} from '~~/shared/domain/analytics'
import { lastDateKeys } from '~~/shared/utils/dates'
import type { GoalRepository } from '../../repositories/goal.repository'
import type { HabitRepository } from '../../repositories/habit.repository'
import { goalRepository } from '../../repositories/prisma/prisma-goal.repository'
import { habitRepository } from '../../repositories/prisma/prisma-habit.repository'
import { ApplicationError } from '../../domain/errors'

export class AnalyticsService {
  constructor(
    private readonly habits: HabitRepository,
    private readonly goals: GoalRepository
  ) {}

  async overview(userId: string, today: string): Promise<AnalyticsOverviewResponse> {
    const [habits, goals] = await Promise.all([
      this.habits.findManyByUserId(userId),
      this.goals.findManyByUserId(userId)
    ])
    const weeks = currentAndPreviousWeek(habits, today)
    return {
      today,
      currentWeek: weeks.current,
      previousWeek: weeks.previous,
      changePercentagePoints: weeks.current.rate - weeks.previous.rate,
      statusTotals: {
        COMPLETED: weeks.current.completed,
        PARTIAL: weeks.current.partial,
        SKIPPED: weeks.current.skipped,
        MISSED: weeks.current.missed
      },
      heatmap: calculateHeatmap(habits, lastDateKeys(90, today), today),
      weekdays: calculateWeekdayAnalytics(habits, lastDateKeys(90, today), today),
      habits: habits.map((habit) => calculateHabitAnalytics(habit, today)),
      goals: goals.filter((goal) => goal.status !== 'ARCHIVED').map((goal) => calculateGoalProgress(goal, habits, today)),
      weeklyReview: calculateWeeklyReview(habits, today)
    }
  }

  async habit(userId: string, habitId: string, today: string): Promise<HabitAnalyticsDto> {
    const habit = await this.habits.findByIdForUser(userId, habitId)
    if (!habit) throw new ApplicationError('Привычка не найдена', 404)
    return calculateHabitAnalytics(habit, today)
  }
}

export const analyticsService = new AnalyticsService(habitRepository, goalRepository)
