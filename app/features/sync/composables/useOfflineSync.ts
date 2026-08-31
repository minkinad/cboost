import { useQueryClient } from '@tanstack/vue-query'
import type { HabitEntryPutInput } from '~~/shared/schemas/habits'
import { habitQueryKeys } from '../../habits/composables/useHabitQueries'
import { analyticsQueryKeys } from '../../progress/composables/useAnalyticsQueries'
import { listPendingEntries, putPendingEntry, recordPendingFailure, removePendingEntry } from '../model/offline-queue'

export type SyncStatus = 'SYNCED' | 'SAVING' | 'SAVED_OFFLINE' | 'SYNCING' | 'SYNC_FAILED'

export function useOfflineSync() {
  const queryClient = useQueryClient()
  const status = useState<SyncStatus>('offline-sync-status', () => 'SYNCED')
  const pendingCount = useState<number>('offline-sync-count', () => 0)
  const online = useState<boolean>('offline-sync-online', () => import.meta.client ? navigator.onLine : true)
  const flushing = useState<boolean>('offline-sync-flushing', () => false)

  async function refreshCount() {
    pendingCount.value = (await listPendingEntries()).length
  }

  async function enqueueEntry(habitId: string, date: string, input: HabitEntryPutInput) {
    await putPendingEntry(habitId, date, input)
    await refreshCount()
    status.value = 'SAVED_OFFLINE'
  }

  async function flush() {
    if (flushing.value || !navigator.onLine) return
    const pending = await listPendingEntries()
    if (!pending.length) {
      status.value = 'SYNCED'
      pendingCount.value = 0
      return
    }
    flushing.value = true
    status.value = 'SYNCING'
    for (const mutation of pending) {
      try {
        await $fetch(`/api/habits/${mutation.habitId}/entries/${mutation.date}`, { method: 'PUT', body: mutation.input })
        await removePendingEntry(mutation.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed'
        await recordPendingFailure(mutation, message)
        status.value = 'SYNC_FAILED'
        flushing.value = false
        await refreshCount()
        return
      }
    }
    flushing.value = false
    await refreshCount()
    status.value = 'SYNCED'
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all })
    ])
  }

  function setSaving() {
    status.value = 'SAVING'
  }

  function setSynced() {
    if (pendingCount.value === 0) status.value = 'SYNCED'
  }

  function setFailed() {
    status.value = 'SYNC_FAILED'
  }

  function initialize() {
    const handleOnline = () => {
      online.value = true
      void flush()
    }
    const handleOffline = () => {
      online.value = false
      if (pendingCount.value) status.value = 'SAVED_OFFLINE'
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void refreshCount().then(() => {
      if (navigator.onLine) void flush()
      else if (pendingCount.value) status.value = 'SAVED_OFFLINE'
    })
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  return { status, pendingCount, online, enqueueEntry, flush, setSaving, setSynced, setFailed, initialize }
}
