import { useQuery } from '@tanstack/vue-query'
import type { CategoriesResponse, GoalsResponse } from '~~/shared/contracts/organization'

export const organizationQueryKeys = {
  all: ['organization'] as const,
  categories: ['organization', 'categories'] as const,
  goals: ['organization', 'goals'] as const
}

export function useCategoriesQuery() {
  const requestFetch = useRequestFetch()
  return useQuery({
    queryKey: organizationQueryKeys.categories,
    enabled: import.meta.client,
    queryFn: async () => (await requestFetch<CategoriesResponse>('/api/categories')).categories
  })
}

export function useGoalsQuery() {
  const requestFetch = useRequestFetch()
  return useQuery({
    queryKey: organizationQueryKeys.goals,
    enabled: import.meta.client,
    queryFn: async () => (await requestFetch<GoalsResponse>('/api/goals')).goals
  })
}
