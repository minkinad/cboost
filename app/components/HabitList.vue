<script setup lang="ts">
import type { Habit } from '~~/shared/types/tracker'
import { lastNDays } from '~~/shared/utils/dates'
import { isHabitDueOnDate } from '~~/shared/utils/tracker'

const props = defineProps<{
  habits: Habit[]
  todayKey: string
}>()

const emit = defineEmits<{
  toggle: [habitId: string, dateKey: string]
  remove: [habitId: string]
}>()

const recentKeys = computed(() => lastNDays(7, new Date()))

function isDone(habit: Habit, dateKey: string) {
  return habit.completions.includes(dateKey)
}

function completionRatio(habit: Habit) {
  const due = recentKeys.value.filter((dateKey) => isHabitDueOnDate(habit, dateKey)).length

  if (due === 0) {
    return 0
  }

  const done = recentKeys.value.filter((dateKey) => habit.completions.includes(dateKey)).length
  return Math.round((done / due) * 100)
}

function createdLabel(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'дата неизвестна'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const emptyState = computed(() => props.habits.length === 0)
</script>

<template>
  <section class="panel-card">
    <div class="section-head">
      <h2>Список привычек</h2>
      <p>Отмечай прогресс за сегодня и смотри стабильность за 7 дней.</p>
    </div>

    <div v-if="emptyState" class="empty-card">
      <p>Пока нет привычек. Добавь первую, чтобы запустить прогресс.</p>
    </div>

    <ul v-else class="habit-list">
      <li v-for="habit in habits" :key="habit.id" class="habit-item">
        <div class="habit-title-row">
          <span class="habit-color" :style="{ backgroundColor: habit.color }" />
          <div>
            <h3>{{ habit.title }}</h3>
            <p>
              {{ habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно' }}
              · цель {{ habit.target }} {{ habit.unit }}
              · создано {{ createdLabel(habit.createdAt) }}
            </p>
          </div>
        </div>

        <p v-if="habit.description" class="habit-description">{{ habit.description }}</p>

        <div class="habit-actions">
          <button
            class="toggle-btn"
            :class="{ done: isDone(habit, todayKey) }"
            :disabled="!isHabitDueOnDate(habit, todayKey)"
            @click="emit('toggle', habit.id, todayKey)"
          >
            {{ isDone(habit, todayKey) ? 'Выполнено сегодня' : 'Отметить выполненным' }}
          </button>

          <button class="text-btn" @click="emit('remove', habit.id)">Удалить</button>

          <span class="ratio-chip">7д {{ completionRatio(habit) }}%</span>
        </div>

        <div class="mini-track">
          <span
            v-for="dateKey in recentKeys"
            :key="`${habit.id}-${dateKey}`"
            class="mini-dot"
            :class="{
              due: isHabitDueOnDate(habit, dateKey),
              done: habit.completions.includes(dateKey)
            }"
            :title="`${dateKey}: ${habit.completions.includes(dateKey) ? 'Сделано' : 'Открыто'}`"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
