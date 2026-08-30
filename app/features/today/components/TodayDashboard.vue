<script setup lang="ts">
import { calculateDailyCompletion, canRecordEntryForDate } from '~~/shared/domain/habits'
import type { HabitEntryPutInput } from '~~/shared/schemas/habits'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { useHabitMutations } from '../../habits/composables/useHabitMutations'
import { useHabitsQuery } from '../../habits/composables/useHabitQueries'
import { formatLongDate } from '../../habits/model/habit-presenters'

const { user } = useUserSession()
const timezone = computed(() => user.value?.timezone || 'UTC')
const todayKey = computed(() => getDateKeyInTimeZone(new Date(), timezone.value))
const habitsQuery = useHabitsQuery()
const habits = computed(() => habitsQuery.data.value ?? [])
const scheduledHabits = computed(() => habits.value.filter((habit) => canRecordEntryForDate(habit, todayKey.value)))
const completion = computed(() => calculateDailyCompletion(habits.value, todayKey.value, todayKey.value))
const { entryMutation } = useHabitMutations()

function record(habitId: string, input: HabitEntryPutInput) {
  entryMutation.mutate({ habitId, date: todayKey.value, input })
}
</script>

<template>
  <div class="feature-page today-page">
    <header class="page-heading today-heading">
      <div>
        <p class="page-kicker">{{ formatLongDate(todayKey) }}</p>
        <h1>Сегодня</h1>
        <p>Маленькие действия складываются в устойчивый ритм.</p>
      </div>
      <UButton to="/habits/new" icon="i-lucide-plus" size="lg">Новая привычка</UButton>
    </header>

    <section class="today-summary" aria-label="Прогресс за сегодня">
      <div class="summary-ring" :style="{ '--progress': `${completion.rate * 3.6}deg` }">
        <span>{{ completion.rate }}%</span>
      </div>
      <div class="summary-copy">
        <strong>{{ completion.completed }} из {{ completion.expected }} выполнено</strong>
        <span v-if="completion.expected - completion.completed > 0">Осталось {{ completion.expected - completion.completed }}</span>
        <span v-else>План на сегодня закрыт</span>
      </div>
      <div class="summary-track" aria-hidden="true">
        <span :style="{ width: `${completion.rate}%` }" />
      </div>
    </section>

    <div v-if="habitsQuery.isPending.value" class="today-list" aria-label="Загрузка привычек">
      <div v-for="index in 4" :key="index" class="surface-card habit-skeleton">
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-4 w-64" />
        <USkeleton class="h-10 w-full" />
      </div>
    </div>

    <UAlert
      v-else-if="habitsQuery.isError.value"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Не удалось загрузить привычки"
      description="Проверьте соединение и попробуйте снова."
      :actions="[{ label: 'Повторить', onClick: () => habitsQuery.refetch() }]"
    />

    <section v-else-if="scheduledHabits.length" class="today-list" aria-label="Привычки на сегодня">
      <TodayHabitCard
        v-for="habit in scheduledHabits"
        :key="habit.id"
        :habit="habit"
        :today="todayKey"
        :saving="entryMutation.isPending.value && entryMutation.variables.value?.habitId === habit.id"
        @record="record(habit.id, $event)"
      />
    </section>

    <section v-else class="surface-card empty-state">
      <div class="empty-icon"><UIcon name="i-lucide-sparkles" class="size-6" /></div>
      <h2>На сегодня всё свободно</h2>
      <p>Добавьте привычку или отдохните без чувства вины.</p>
      <UButton to="/habits/new" variant="soft" icon="i-lucide-plus">Добавить привычку</UButton>
    </section>
  </div>
</template>
