import { useQuery } from '@tanstack/vue-query'
import type { RemindersResponse } from '~~/shared/contracts/reminders'
import type { HabitReminderDto } from '~~/shared/types/reminders'

export const reminderQueryKeys = {
  all: ['reminders'] as const,
  habit: (habitId: string) => ['reminders', { habitId }] as const
}

export function useRemindersQuery(habitId?: string) {
  const requestFetch = useRequestFetch()
  const queryKey: readonly unknown[] = habitId ? reminderQueryKeys.habit(habitId) : reminderQueryKeys.all
  return useQuery<HabitReminderDto[]>({
    queryKey,
    enabled: import.meta.client,
    queryFn: async () => (await requestFetch<RemindersResponse>('/api/reminders', { query: habitId ? { habitId } : undefined })).reminders
  })
}
