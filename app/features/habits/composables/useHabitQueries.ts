import { useQuery } from '@tanstack/vue-query'
import type { HabitResponse, HabitsResponse } from '~~/shared/contracts/habits'

export const habitQueryKeys = {
  all: ['habits'] as const,
  list: (includeArchived: boolean) => ['habits', { includeArchived }] as const,
  detail: (id: string) => ['habit', id] as const
}

export function useHabitsQuery(includeArchived = false) {
  const requestFetch = useRequestFetch()

  return useQuery({
    queryKey: habitQueryKeys.list(includeArchived),
    enabled: import.meta.client,
    queryFn: async () => {
      const response = await requestFetch<HabitsResponse>('/api/habits', {
        query: includeArchived ? { includeArchived: 'true' } : undefined
      })
      return response.habits
    }
  })
}

export function useHabitQuery(id: string) {
  const requestFetch = useRequestFetch()

  return useQuery({
    queryKey: habitQueryKeys.detail(id),
    enabled: import.meta.client && Boolean(id),
    queryFn: async () => {
      const response = await requestFetch<HabitResponse>(`/api/habits/${id}`)
      return response.habit
    }
  })
}
