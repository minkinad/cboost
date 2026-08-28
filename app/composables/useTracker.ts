import type {
  HabitEntryResponse,
  HabitResponse,
  HabitsResponse,
  LegacyImportResponse
} from '~~/shared/contracts/habits'
import type { HabitCreateInput } from '~~/shared/schemas/habits'
import type { HabitDto } from '~~/shared/types/habits'
import type { Habit } from '~~/shared/types/tracker'
import { getDateKey } from '~~/shared/utils/dates'
import { calculateStats, isHabitDueOnDate, normalizeState } from '~~/shared/utils/tracker'

const LOCAL_STORAGE_KEY = 'dailyboost.tracker.v1'
const MIGRATED_AT_KEY = 'dailyboost.tracker.v1.migratedAt'

function loadLegacyHabits(): Habit[] {
  if (!import.meta.client) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? normalizeState(JSON.parse(raw)).habits : []
  } catch {
    return []
  }
}

function toViewHabit(habit: HabitDto): Habit {
  return {
    id: habit.id,
    title: habit.title,
    description: habit.description ?? '',
    frequency: habit.schedule.type === 'DAILY' ? 'daily' : 'weekly',
    target: habit.targetValue ?? 1,
    unit: habit.unit ?? 'выполнение',
    color: habit.color ?? '#ff5c3d',
    createdAt: habit.createdAt,
    completions: (habit.entries ?? [])
      .filter((entry) => entry.status === 'COMPLETED')
      .map((entry) => entry.date)
  }
}

export function useTracker() {
  const habits = useState<Habit[]>('tracker-habits', () => [])
  const source = useState<'server'>('tracker-source', () => 'server')
  const loading = useState<boolean>('tracker-loading', () => false)
  const ready = useState<boolean>('tracker-ready', () => false)
  const errorMessage = useState<string | null>('tracker-error-message', () => null)

  const stats = computed(() => calculateStats(habits.value))
  const todayKey = computed(() => getDateKey(new Date()))
  const todayProgress = computed(() => {
    const todayPoint = stats.value.dailySeries[stats.value.dailySeries.length - 1]
    return {
      expected: todayPoint?.expected || 0,
      completed: todayPoint?.completed || 0,
      pending: Math.max(0, (todayPoint?.expected || 0) - (todayPoint?.completed || 0))
    }
  })

  async function importLegacyData(): Promise<LegacyImportResponse | null> {
    const legacyHabits = loadLegacyHabits()

    if (legacyHabits.length === 0) {
      return null
    }

    const result = await $fetch<LegacyImportResponse>('/api/legacy/import', {
      method: 'POST',
      body: { habits: legacyHabits }
    })

    // Удаляем старое состояние только после подтверждённой сервером транзакции.
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    window.localStorage.setItem(MIGRATED_AT_KEY, new Date().toISOString())
    return result
  }

  async function pullFromServer() {
    const response = await $fetch<HabitsResponse>('/api/habits')
    habits.value = response.habits.map(toViewHabit)
  }

  async function init() {
    if (!import.meta.client || ready.value || loading.value) {
      return
    }

    loading.value = true
    errorMessage.value = null

    try {
      await importLegacyData()
      await pullFromServer()
      ready.value = true
    } catch {
      errorMessage.value = 'Не удалось загрузить данные. Локальная копия не удалена.'
    } finally {
      loading.value = false
    }
  }

  async function addHabit(input: HabitCreateInput) {
    errorMessage.value = null

    try {
      const response = await $fetch<HabitResponse>('/api/habits', { method: 'POST', body: input })
      habits.value = [toViewHabit(response.habit), ...habits.value]
    } catch (error) {
      errorMessage.value = 'Не удалось сохранить привычку.'
      throw error
    }
  }

  async function deleteHabit(habitId: string) {
    errorMessage.value = null

    try {
      await $fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      habits.value = habits.value.filter((habit) => habit.id !== habitId)
    } catch (error) {
      errorMessage.value = 'Не удалось удалить привычку.'
      throw error
    }
  }

  async function toggleHabit(habitId: string, dateKey = todayKey.value) {
    errorMessage.value = null
    const habit = habits.value.find((candidate) => candidate.id === habitId)

    if (!habit) {
      return
    }

    const completed = habit.completions.includes(dateKey)

    try {
      const response = await $fetch<HabitEntryResponse>(`/api/habits/${habitId}/entries/${dateKey}`, {
        method: 'PUT',
        body: { status: completed ? 'PENDING' : 'COMPLETED' }
      })
      const nextCompletions = new Set(habit.completions)

      if (response.entry.status === 'COMPLETED') {
        nextCompletions.add(dateKey)
      } else {
        nextCompletions.delete(dateKey)
      }

      habit.completions = [...nextCompletions].sort()
    } catch (error) {
      errorMessage.value = 'Не удалось обновить выполнение.'
      throw error
    }
  }

  const dueTodayHabits = computed(() => habits.value.filter((habit) => isHabitDueOnDate(habit, todayKey.value)))

  return {
    habits,
    stats,
    source,
    loading,
    ready,
    errorMessage,
    todayKey,
    todayProgress,
    dueTodayHabits,
    init,
    addHabit,
    deleteHabit,
    toggleHabit
  }
}
