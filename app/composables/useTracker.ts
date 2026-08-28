import type {
  HabitEntryResponse,
  HabitResponse,
  HabitsResponse,
  LegacyImportResponse
} from '~~/shared/contracts/habits'
import {
  adjustTrackingValue,
  calculateBestHabitStreak,
  calculateDailyCompletion,
  calculateHabitStreak,
  calculateTrackerStats,
  canRecordEntryForDate,
  getEntryStatusForDate,
  isHabitScheduledForDate,
  trackingStep
} from '~~/shared/domain/habits'
import type { HabitCreateInput } from '~~/shared/schemas/habits'
import type { HabitDto, HabitEntryDto, HabitScheduleType } from '~~/shared/types/habits'
import type { Habit, HabitListItemView } from '~~/shared/types/tracker'
import { getDateKeyInTimeZone, lastDateKeys } from '~~/shared/utils/dates'
import { normalizeState } from '~~/shared/utils/tracker'

const LOCAL_STORAGE_KEY = 'dailyboost.tracker.v1'
const MIGRATED_AT_KEY = 'dailyboost.tracker.v1.migratedAt'

function loadLegacyHabits(): Habit[] {
  if (!import.meta.client) return []

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? normalizeState(JSON.parse(raw)).habits : []
  } catch {
    return []
  }
}

function scheduleLabel(type: HabitScheduleType, habit: HabitDto): string {
  if (type === 'EVERY_DAY') return 'Каждый день'
  if (type === 'WEEKDAYS') return `Дни недели: ${habit.schedule.weekdays.join(', ')}`
  if (type === 'TIMES_PER_WEEK') return `${habit.schedule.timesPerWeek} раз в неделю`
  return `Каждые ${habit.schedule.intervalDays} дн.`
}

function createdLabel(value: string, timezone: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

function replaceEntry(habit: HabitDto, entry: HabitEntryDto): void {
  const entries = habit.entries ?? []
  const index = entries.findIndex((candidate) => candidate.date === entry.date)
  habit.entries = index < 0
    ? [...entries, entry].sort((left, right) => left.date.localeCompare(right.date))
    : entries.map((candidate, candidateIndex) => candidateIndex === index ? entry : candidate)
}

export function useTracker() {
  const { user } = useUserSession()
  const habits = useState<HabitDto[]>('tracker-habits', () => [])
  const source = useState<'server'>('tracker-source', () => 'server')
  const loading = useState<boolean>('tracker-loading', () => false)
  const ready = useState<boolean>('tracker-ready', () => false)
  const errorMessage = useState<string | null>('tracker-error-message', () => null)
  const timezone = computed(() => user.value?.timezone || 'UTC')
  const todayKey = computed(() => getDateKeyInTimeZone(new Date(), timezone.value))
  const stats = computed(() => calculateTrackerStats(habits.value, todayKey.value))
  const todayProgress = computed(() => {
    const day = calculateDailyCompletion(habits.value, todayKey.value, todayKey.value)
    return {
      expected: day.expected,
      completed: day.completed,
      pending: Math.max(0, day.expected - day.completed)
    }
  })

  const habitItems = computed<HabitListItemView[]>(() => {
    const recentDates = lastDateKeys(7, todayKey.value)

    return habits.value.map((habit) => {
      const todayEntry = (habit.entries ?? []).find((entry) => entry.date === todayKey.value)
      return {
        id: habit.id,
        title: habit.title,
        description: habit.description ?? '',
        color: habit.color ?? '#ff5c3d',
        trackingType: habit.trackingType,
        targetValue: habit.targetValue,
        unit: habit.unit ?? 'выполнение',
        currentValue: todayEntry?.value ?? null,
        step: trackingStep(habit.trackingType),
        status: getEntryStatusForDate(habit, todayKey.value, todayKey.value),
        scheduledToday: canRecordEntryForDate(habit, todayKey.value),
        scheduleLabel: scheduleLabel(habit.schedule.type, habit),
        createdLabel: createdLabel(habit.createdAt, timezone.value),
        currentStreak: calculateHabitStreak(habit, todayKey.value),
        bestStreak: calculateBestHabitStreak(habit, todayKey.value),
        recentDays: recentDates.map((date) => ({
          date,
          scheduled: date === todayKey.value
            ? canRecordEntryForDate(habit, date)
            : isHabitScheduledForDate(habit, habit.schedule, date),
          status: getEntryStatusForDate(habit, date, todayKey.value)
        }))
      }
    })
  })

  async function importLegacyData(): Promise<LegacyImportResponse | null> {
    const legacyHabits = loadLegacyHabits()
    if (legacyHabits.length === 0) return null

    const result = await $fetch<LegacyImportResponse>('/api/legacy/import', {
      method: 'POST',
      body: { habits: legacyHabits }
    })
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    window.localStorage.setItem(MIGRATED_AT_KEY, new Date().toISOString())
    return result
  }

  async function pullFromServer() {
    const response = await $fetch<HabitsResponse>('/api/habits')
    habits.value = response.habits
  }

  async function init() {
    if (!import.meta.client || ready.value || loading.value) return
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
    const response = await $fetch<HabitResponse>('/api/habits', { method: 'POST', body: input })
    habits.value = [response.habit, ...habits.value]
  }

  async function deleteHabit(habitId: string) {
    await $fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
    habits.value = habits.value.filter((habit) => habit.id !== habitId)
  }

  async function putEntry(habit: HabitDto, body: Record<string, unknown>) {
    errorMessage.value = null

    try {
      const response = await $fetch<HabitEntryResponse>(`/api/habits/${habit.id}/entries/${todayKey.value}`, {
        method: 'PUT',
        body
      })
      replaceEntry(habit, response.entry)
    } catch (error) {
      errorMessage.value = 'Не удалось обновить прогресс.'
      throw error
    }
  }

  async function toggleHabit(habitId: string) {
    const habit = habits.value.find((candidate) => candidate.id === habitId)
    if (!habit || habit.trackingType !== 'BOOLEAN') return
    const status = getEntryStatusForDate(habit, todayKey.value, todayKey.value)
    await putEntry(habit, { completed: status !== 'COMPLETED' })
  }

  async function adjustHabit(habitId: string, direction: -1 | 1) {
    const habit = habits.value.find((candidate) => candidate.id === habitId)
    if (!habit || habit.trackingType === 'BOOLEAN') return
    const entry = (habit.entries ?? []).find((candidate) => candidate.date === todayKey.value)
    await putEntry(habit, { value: adjustTrackingValue(habit.trackingType, entry?.value ?? null, direction) })
  }

  async function skipHabit(habitId: string, note?: string) {
    const habit = habits.value.find((candidate) => candidate.id === habitId)
    if (!habit) return
    await putEntry(habit, { status: 'SKIPPED', note: note || null })
  }

  return {
    habits,
    habitItems,
    stats,
    source,
    loading,
    ready,
    errorMessage,
    timezone,
    todayKey,
    todayProgress,
    init,
    addHabit,
    deleteHabit,
    toggleHabit,
    adjustHabit,
    skipHabit
  }
}
