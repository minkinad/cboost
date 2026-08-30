<script setup lang="ts">
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { useHabitMutations } from '../../features/habits/composables/useHabitMutations'
import { useHabitsQuery } from '../../features/habits/composables/useHabitQueries'
import { useCategoriesQuery } from '../../features/organization/composables/useOrganizationQueries'
import { useAnalyticsOverviewQuery } from '../../features/progress/composables/useAnalyticsQueries'

const { user } = useUserSession()
const today = computed(() => getDateKeyInTimeZone(new Date(), user.value?.timezone || 'UTC'))
const habitsQuery = useHabitsQuery(true)
const categoriesQuery = useCategoriesQuery()
const analyticsQuery = useAnalyticsOverviewQuery()
const active = computed(() => (habitsQuery.data.value ?? []).filter((habit) => !habit.archivedAt))
const archived = computed(() => (habitsQuery.data.value ?? []).filter((habit) => habit.archivedAt))
const { archiveMutation, restoreMutation } = useHabitMutations()
const categoryById = computed(() => new Map((categoriesQuery.data.value ?? []).map((category) => [category.id, category.name])))
const streakByHabit = computed(() => new Map((analyticsQuery.data.value?.habits ?? []).map((habit) => [habit.habitId, habit.currentStreak])))

function isPending(habitId: string) {
  return (archiveMutation.isPending.value && archiveMutation.variables.value === habitId)
    || (restoreMutation.isPending.value && restoreMutation.variables.value === habitId)
}
</script>

<template>
  <div class="feature-page">
    <header class="page-heading">
      <div><p class="page-kicker">Ваша система</p><h1>Привычки</h1><p>Настраивайте ритм, цели и способ отслеживания.</p></div>
      <UButton to="/habits/new" icon="i-lucide-plus" size="lg">Новая привычка</UButton>
    </header>

    <div v-if="habitsQuery.isPending.value" class="overview-list">
      <div v-for="index in 4" :key="index" class="surface-card habit-skeleton"><USkeleton class="h-5 w-44" /><USkeleton class="h-4 w-72" /></div>
    </div>
    <UAlert v-else-if="habitsQuery.isError.value" color="error" variant="subtle" title="Не удалось загрузить привычки" />
    <template v-else>
      <section class="habit-section">
        <div class="section-title"><div><h2>Активные</h2><p>Появляются в плане согласно расписанию.</p></div><UBadge color="neutral" variant="soft">{{ active.length }}</UBadge></div>
        <div v-if="active.length" class="overview-list">
          <HabitOverviewCard v-for="habit in active" :key="habit.id" :habit="habit" :today="today" :current-streak="streakByHabit.get(habit.id)" :category-name="habit.categoryId ? categoryById.get(habit.categoryId) : undefined" :pending="isPending(habit.id)" @archive="archiveMutation.mutate(habit.id)" />
        </div>
        <div v-else class="surface-card empty-inline"><p>Нет активных привычек.</p><UButton to="/habits/new" variant="soft">Создать первую</UButton></div>
      </section>

      <section class="habit-section archived-section">
        <div class="section-title"><div><h2>Архив</h2><p>История сохранена, привычку можно вернуть.</p></div><UBadge color="neutral" variant="soft">{{ archived.length }}</UBadge></div>
        <div v-if="archived.length" class="overview-list">
          <HabitOverviewCard v-for="habit in archived" :key="habit.id" :habit="habit" :today="today" :current-streak="streakByHabit.get(habit.id)" :category-name="habit.categoryId ? categoryById.get(habit.categoryId) : undefined" :pending="isPending(habit.id)" @restore="restoreMutation.mutate(habit.id)" />
        </div>
        <p v-else class="muted-empty">Здесь пока пусто.</p>
      </section>
    </template>
  </div>
</template>
