import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { CategoryResponse, GoalResponse } from '~~/shared/contracts/organization'
import type { CategoryCreateInput, GoalCreateInput, GoalUpdateInput } from '~~/shared/schemas/organization'
import { habitQueryKeys } from '../../habits/composables/useHabitQueries'
import { analyticsQueryKeys } from '../../progress/composables/useAnalyticsQueries'
import { organizationQueryKeys } from './useOrganizationQueries'

export function useOrganizationMutations() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const refreshCategories = () => void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.categories })
  const refreshGoals = () => {
    void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.goals })
    void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all })
  }

  const createCategory = useMutation({
    mutationFn: async (input: CategoryCreateInput) => (await $fetch<CategoryResponse>('/api/categories', { method: 'POST', body: input })).category,
    onSuccess: () => { refreshCategories(); toast.add({ title: 'Категория создана', color: 'success' }) },
    onError: () => toast.add({ title: 'Не удалось создать категорию', color: 'error' })
  })
  const deleteCategory = useMutation({
    mutationFn: (id: string) => $fetch(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refreshCategories(); void queryClient.invalidateQueries({ queryKey: habitQueryKeys.all }); toast.add({ title: 'Категория удалена' }) },
    onError: () => toast.add({ title: 'Не удалось удалить категорию', color: 'error' })
  })
  const createGoal = useMutation({
    mutationFn: async (input: GoalCreateInput) => (await $fetch<GoalResponse>('/api/goals', { method: 'POST', body: input })).goal,
    onSuccess: () => { refreshGoals(); toast.add({ title: 'Цель создана', color: 'success' }) },
    onError: () => toast.add({ title: 'Не удалось создать цель', color: 'error' })
  })
  const updateGoal = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalUpdateInput }) => (await $fetch<GoalResponse>(`/api/goals/${id}`, { method: 'PATCH', body: input })).goal,
    onSuccess: () => { refreshGoals(); toast.add({ title: 'Цель обновлена', color: 'success' }) },
    onError: () => toast.add({ title: 'Не удалось обновить цель', color: 'error' })
  })
  const deleteGoal = useMutation({
    mutationFn: (id: string) => $fetch(`/api/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => { refreshGoals(); toast.add({ title: 'Цель удалена' }) },
    onError: () => toast.add({ title: 'Не удалось удалить цель', color: 'error' })
  })
  return { createCategory, deleteCategory, createGoal, updateGoal, deleteGoal }
}
