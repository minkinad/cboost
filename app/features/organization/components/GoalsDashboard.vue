<script setup lang="ts">
import { goalCreateInputSchema, type GoalCreateInput } from '~~/shared/schemas/organization'
import { useHabitsQuery } from '../../habits/composables/useHabitQueries'
import { useAnalyticsOverviewQuery } from '../../progress/composables/useAnalyticsQueries'
import { useOrganizationMutations } from '../composables/useOrganizationMutations'
import { useGoalsQuery } from '../composables/useOrganizationQueries'

const goalsQuery = useGoalsQuery()
const habitsQuery = useHabitsQuery()
const analyticsQuery = useAnalyticsOverviewQuery()
const { createGoal, updateGoal, deleteGoal } = useOrganizationMutations()
const modalOpen = ref(false)
const state = reactive<GoalCreateInput>({ title: '', description: null, targetDate: null, status: 'ACTIVE', habits: [] })

const goals = computed(() => goalsQuery.data.value ?? [])
const habits = computed(() => habitsQuery.data.value ?? [])
const progressByGoal = computed(() => new Map((analyticsQuery.data.value?.goals ?? []).map((goal) => [goal.goalId, goal])))
const descriptionModel = computed<string>({ get: () => state.description ?? '', set: value => { state.description = value || null } })
const targetDateModel = computed<string>({ get: () => state.targetDate ?? '', set: value => { state.targetDate = value || null } })

function isSelected(habitId: string) {
  return state.habits.some((habit) => habit.habitId === habitId)
}

function toggleHabit(habitId: string) {
  state.habits = isSelected(habitId)
    ? state.habits.filter((habit) => habit.habitId !== habitId)
    : [...state.habits, { habitId, weight: 1 }]
}

function setWeight(habitId: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  state.habits = state.habits.map((habit) => habit.habitId === habitId ? { ...habit, weight: value } : habit)
}

async function create() {
  await createGoal.mutateAsync(goalCreateInputSchema.parse(state))
  Object.assign(state, { title: '', description: null, targetDate: null, status: 'ACTIVE', habits: [] })
  modalOpen.value = false
}
</script>

<template>
  <div class="feature-page">
    <header class="page-heading"><div><p class="page-kicker">Направление</p><h1>Цели</h1><p>Связывайте долгосрочные результаты с ежедневными привычками.</p></div><UButton icon="i-lucide-plus" size="lg" @click="modalOpen = true">Новая цель</UButton></header>
    <div v-if="goalsQuery.isPending.value" class="overview-list"><USkeleton v-for="index in 3" :key="index" class="h-44 rounded-2xl" /></div>
    <UAlert v-else-if="goalsQuery.isError.value" color="error" variant="subtle" title="Не удалось загрузить цели" />
    <div v-else-if="goals.length" class="goals-grid">
      <article v-for="goal in goals" :key="goal.id" class="surface-card goal-card" :class="{ archived: goal.status === 'ARCHIVED' }">
        <div class="goal-card-heading"><div><UBadge :color="goal.status === 'COMPLETED' ? 'success' : goal.status === 'ARCHIVED' ? 'neutral' : 'primary'" variant="soft">{{ goal.status }}</UBadge><h2>{{ goal.title }}</h2><p>{{ goal.description || 'Без описания' }}</p></div><strong class="goal-progress-value">{{ progressByGoal.get(goal.id)?.progress ?? 0 }}%</strong></div>
        <UProgress :model-value="progressByGoal.get(goal.id)?.progress ?? 0" />
        <div class="goal-habits"><span v-for="link in goal.habits" :key="link.habitId">{{ link.habit?.title || 'Привычка' }} <small>×{{ link.weight }}</small></span><em v-if="!goal.habits.length">Добавьте связанные привычки</em></div>
        <div class="goal-meta"><span v-if="goal.targetDate"><UIcon name="i-lucide-calendar" /> {{ goal.targetDate }}</span><span>Последние 30 scheduled days</span></div>
        <div class="goal-actions"><UButton v-if="goal.status === 'ACTIVE'" variant="soft" icon="i-lucide-check" @click="updateGoal.mutate({ id: goal.id, input: { status: 'COMPLETED' } })">Завершить</UButton><UButton v-else-if="goal.status !== 'ARCHIVED'" color="neutral" variant="soft" @click="updateGoal.mutate({ id: goal.id, input: { status: 'ACTIVE' } })">Вернуть в активные</UButton><UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" aria-label="Удалить цель" @click="deleteGoal.mutate(goal.id)" /></div>
      </article>
    </div>
    <div v-else class="surface-card empty-inline"><p>Целей пока нет. Создайте цель и свяжите её с привычками.</p><UButton variant="soft" @click="modalOpen = true">Создать цель</UButton></div>

    <UModal v-model:open="modalOpen" title="Новая цель" description="Прогресс будет рассчитан по связанным привычкам.">
      <template #body>
        <UForm :schema="goalCreateInputSchema" :state="state" class="goal-form" @submit="create">
          <UFormField label="Название" name="title" required><UInput v-model="state.title" maxlength="120" placeholder="Например, English B2" class="w-full" /></UFormField>
          <UFormField label="Описание" name="description"><UTextarea v-model="descriptionModel" maxlength="2000" class="w-full" /></UFormField>
          <UFormField label="Целевая дата" name="targetDate"><UInput v-model="targetDateModel" type="date" class="w-full" /></UFormField>
          <UFormField label="Связанные привычки" name="habits">
            <div class="goal-habit-picker">
              <label v-for="habit in habits" :key="habit.id"><input type="checkbox" :checked="isSelected(habit.id)" @change="toggleHabit(habit.id)"><span>{{ habit.title }}</span><input v-if="isSelected(habit.id)" type="number" min="0.1" max="1000" step="0.1" :value="state.habits.find(link => link.habitId === habit.id)?.weight" aria-label="Вес" @input="setWeight(habit.id, $event)"></label>
              <p v-if="!habits.length">Сначала создайте хотя бы одну привычку.</p>
            </div>
          </UFormField>
          <UAlert color="neutral" variant="subtle" title="Формула" description="Взвешенное среднее completion rate привычек за их последние 30 запланированных дней." />
          <div class="dialog-actions"><UButton type="button" color="neutral" variant="ghost" @click="modalOpen = false">Отмена</UButton><UButton type="submit" icon="i-lucide-check" :loading="createGoal.isPending.value">Создать</UButton></div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
