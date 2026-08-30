import { useQuery } from '@tanstack/vue-query'
import type { AnalyticsOverviewResponse, HabitAnalyticsResponse } from '~~/shared/contracts/analytics'

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  overview: ['analytics', 'overview'] as const,
  habit: (id: string) => ['analytics', 'habit', id] as const
}

export function useAnalyticsOverviewQuery() {
  const requestFetch = useRequestFetch()
  return useQuery({
    queryKey: analyticsQueryKeys.overview,
    enabled: import.meta.client,
    queryFn: () => requestFetch<AnalyticsOverviewResponse>('/api/analytics/overview')
  })
}

export function useHabitAnalyticsQuery(id: string) {
  const requestFetch = useRequestFetch()
  return useQuery({
    queryKey: analyticsQueryKeys.habit(id),
    enabled: import.meta.client && Boolean(id),
    queryFn: async () => (await requestFetch<HabitAnalyticsResponse>(`/api/analytics/habits/${id}`)).analytics
  })
}
