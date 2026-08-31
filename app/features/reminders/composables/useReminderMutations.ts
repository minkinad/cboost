import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { ReminderResponse } from '~~/shared/contracts/reminders'
import type { ReminderCreateInput, ReminderUpdateInput } from '~~/shared/schemas/reminders'
import { reminderQueryKeys } from './useReminderQueries'

export function useReminderMutations(habitId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: reminderQueryKeys.all })
  const createReminder = useMutation({
    mutationFn: async (input: ReminderCreateInput) => (await $fetch<ReminderResponse>(`/api/habits/${habitId}/reminders`, { method: 'POST', body: input })).reminder,
    onSuccess: () => { refresh(); toast.add({ title: 'Напоминание добавлено', color: 'success' }) },
    onError: () => toast.add({ title: 'Не удалось добавить напоминание', color: 'error' })
  })
  const updateReminder = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReminderUpdateInput }) => (await $fetch<ReminderResponse>(`/api/reminders/${id}`, { method: 'PATCH', body: input })).reminder,
    onSuccess: refresh,
    onError: () => toast.add({ title: 'Не удалось изменить напоминание', color: 'error' })
  })
  const deleteReminder = useMutation({
    mutationFn: (id: string) => $fetch<unknown>(`/api/reminders/${id}` as string, { method: 'DELETE' }),
    onSuccess: () => { refresh(); toast.add({ title: 'Напоминание удалено' }) },
    onError: () => toast.add({ title: 'Не удалось удалить напоминание', color: 'error' })
  })
  return { createReminder, updateReminder, deleteReminder }
}
