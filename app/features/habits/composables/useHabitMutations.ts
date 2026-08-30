import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { HabitEntryResponse, HabitResponse } from '~~/shared/contracts/habits'
import { calculateEntryStatus } from '~~/shared/domain/habits'
import type { HabitCreateInput, HabitEntryPutInput, HabitUpdateInput } from '~~/shared/schemas/habits'
import type { HabitDto, HabitEntryDto } from '~~/shared/types/habits'
import { analyticsQueryKeys } from '../../progress/composables/useAnalyticsQueries'
import { habitQueryKeys } from './useHabitQueries'

interface EntryMutationVariables {
  habitId: string
  date: string
  input: HabitEntryPutInput
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string } }).data
    if (data?.statusMessage) return data.statusMessage
  }
  return fallback
}

function replaceEntry(habit: HabitDto, entry: HabitEntryDto): HabitDto {
  const entries = habit.entries ?? []
  const exists = entries.some((candidate) => candidate.date === entry.date)
  return {
    ...habit,
    entries: exists
      ? entries.map((candidate) => candidate.date === entry.date ? entry : candidate)
      : [...entries, entry].sort((left, right) => left.date.localeCompare(right.date))
  }
}

export function useHabitMutations() {
  const queryClient = useQueryClient()
  const toast = useToast()

  function invalidateAnalytics() {
    void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all })
  }

  function updateHabitCaches(habit: HabitDto) {
    queryClient.setQueriesData<HabitDto[]>({ queryKey: habitQueryKeys.all }, (current) => {
      if (!current) return current
      return current.map((candidate) => candidate.id === habit.id ? habit : candidate)
    })
    queryClient.setQueryData(habitQueryKeys.detail(habit.id), habit)
  }

  function findCachedHabit(habitId: string): HabitDto | undefined {
    const detail = queryClient.getQueryData<HabitDto>(habitQueryKeys.detail(habitId))
    if (detail) return detail

    for (const [, habits] of queryClient.getQueriesData<HabitDto[]>({ queryKey: habitQueryKeys.all })) {
      const habit = habits?.find((candidate) => candidate.id === habitId)
      if (habit) return habit
    }
  }

  const entryMutation = useMutation({
    mutationFn: async ({ habitId, date, input }: EntryMutationVariables) => {
      return await $fetch<HabitEntryResponse>(`/api/habits/${habitId}/entries/${date}`, {
        method: 'PUT',
        body: input
      })
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: habitQueryKeys.all })
      await queryClient.cancelQueries({ queryKey: habitQueryKeys.detail(variables.habitId) })
      const listSnapshots = queryClient.getQueriesData<HabitDto[]>({ queryKey: habitQueryKeys.all })
      const detailSnapshot = queryClient.getQueryData<HabitDto>(habitQueryKeys.detail(variables.habitId))
      const habit = findCachedHabit(variables.habitId)

      if (habit) {
        const calculated = calculateEntryStatus({
          trackingType: habit.trackingType,
          targetValue: habit.targetValue,
          value: variables.input.value,
          completed: variables.input.completed,
          explicitStatus: variables.input.status
        })
        const previous = (habit.entries ?? []).find((entry) => entry.date === variables.date)
        const now = new Date().toISOString()
        const optimisticEntry: HabitEntryDto = {
          id: previous?.id ?? `optimistic-${habit.id}-${variables.date}`,
          habitId: habit.id,
          date: variables.date,
          value: calculated.value,
          status: calculated.status,
          note: variables.input.note ?? null,
          createdAt: previous?.createdAt ?? now,
          updatedAt: now
        }
        updateHabitCaches(replaceEntry(habit, optimisticEntry))
      }

      return { listSnapshots, detailSnapshot }
    },
    onError: (error, variables, context) => {
      for (const [key, value] of context?.listSnapshots ?? []) queryClient.setQueryData(key, value)
      queryClient.setQueryData(habitQueryKeys.detail(variables.habitId), context?.detailSnapshot)
      toast.add({
        title: 'Прогресс не сохранён',
        description: getErrorMessage(error, 'Изменение отменено. Попробуйте ещё раз.'),
        color: 'error'
      })
    },
    onSuccess: ({ entry }, variables) => {
      const habit = findCachedHabit(variables.habitId)
      if (habit) updateHabitCaches(replaceEntry(habit, entry))
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.detail(variables.habitId) })
      invalidateAnalytics()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (input: HabitCreateInput) => {
      const response = await $fetch<HabitResponse>('/api/habits', { method: 'POST', body: input })
      return response.habit
    },
    onSuccess: (habit) => {
      queryClient.setQueryData(habitQueryKeys.detail(habit.id), habit)
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      invalidateAnalytics()
      toast.add({ title: 'Привычка создана', color: 'success' })
    },
    onError: (error) => toast.add({ title: 'Не удалось создать привычку', description: getErrorMessage(error, 'Проверьте форму и повторите.'), color: 'error' })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ habitId, input }: { habitId: string; input: HabitUpdateInput }) => {
      const response = await $fetch<HabitResponse>(`/api/habits/${habitId}`, { method: 'PATCH', body: input })
      return response.habit
    },
    onSuccess: (habit) => {
      updateHabitCaches(habit)
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      invalidateAnalytics()
      toast.add({ title: 'Изменения сохранены', color: 'success' })
    },
    onError: (error) => toast.add({ title: 'Не удалось сохранить', description: getErrorMessage(error, 'Попробуйте ещё раз.'), color: 'error' })
  })

  const archiveMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const response = await $fetch<HabitResponse>(`/api/habits/${habitId}/archive`, { method: 'POST' })
      return response.habit
    },
    onSuccess: (habit) => {
      updateHabitCaches(habit)
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      invalidateAnalytics()
      toast.add({ title: 'Привычка перенесена в архив' })
    },
    onError: (error) => toast.add({ title: 'Не удалось архивировать', description: getErrorMessage(error, 'Попробуйте ещё раз.'), color: 'error' })
  })

  const restoreMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const response = await $fetch<HabitResponse>(`/api/habits/${habitId}/restore`, { method: 'POST' })
      return response.habit
    },
    onSuccess: (habit) => {
      updateHabitCaches(habit)
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      invalidateAnalytics()
      toast.add({ title: 'Привычка восстановлена', color: 'success' })
    },
    onError: (error) => toast.add({ title: 'Не удалось восстановить', description: getErrorMessage(error, 'Попробуйте ещё раз.'), color: 'error' })
  })

  const deleteMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await $fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      return habitId
    },
    onSuccess: (habitId) => {
      queryClient.removeQueries({ queryKey: habitQueryKeys.detail(habitId) })
      void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all })
      invalidateAnalytics()
      toast.add({ title: 'Привычка удалена' })
    },
    onError: (error) => toast.add({ title: 'Не удалось удалить', description: getErrorMessage(error, 'Попробуйте ещё раз.'), color: 'error' })
  })

  return {
    entryMutation,
    createMutation,
    updateMutation,
    archiveMutation,
    restoreMutation,
    deleteMutation
  }
}
