<script setup lang="ts">
import type { HabitListItemView } from '~~/shared/types/tracker'

defineProps<{
  habits: HabitListItemView[]
}>()

const emit = defineEmits<{
  toggle: [habitId: string]
  increment: [habitId: string]
  decrement: [habitId: string]
  skip: [habitId: string]
  remove: [habitId: string]
}>()
</script>

<template>
  <section class="panel-card">
    <div class="section-head">
      <h2>Список привычек</h2>
      <p>Прогресс и серии рассчитываются по календарю пользователя.</p>
    </div>

    <div v-if="habits.length === 0" class="empty-card">
      <p>Пока нет привычек. Добавь первую, чтобы запустить прогресс.</p>
    </div>

    <ul v-else class="habit-list">
      <li v-for="habit in habits" :key="habit.id" class="habit-item">
        <div class="habit-title-row">
          <span class="habit-color" :style="{ backgroundColor: habit.color }" />
          <div>
            <h3>{{ habit.title }}</h3>
            <p>{{ habit.scheduleLabel }} · создано {{ habit.createdLabel }}</p>
          </div>
        </div>

        <p v-if="habit.description" class="habit-description">{{ habit.description }}</p>

        <div class="tracking-row">
          <button
            v-if="habit.trackingType === 'BOOLEAN'"
            class="toggle-btn"
            :class="{ done: habit.status === 'COMPLETED' }"
            :disabled="!habit.scheduledToday || habit.status === 'SKIPPED'"
            @click="emit('toggle', habit.id)"
          >
            {{ habit.status === 'COMPLETED' ? '✓ Выполнено' : '○ Отметить' }}
          </button>

          <template v-else>
            <span class="progress-value">{{ habit.currentValue || 0 }} / {{ habit.targetValue }} {{ habit.unit }}</span>
            <button class="step-btn" :disabled="!habit.scheduledToday || habit.status === 'SKIPPED'" @click="emit('decrement', habit.id)">−{{ habit.step }}</button>
            <button class="step-btn" :disabled="!habit.scheduledToday || habit.status === 'SKIPPED'" @click="emit('increment', habit.id)">+{{ habit.step }}</button>
          </template>

          <span class="status-chip" :class="habit.status?.toLowerCase()">{{ habit.status || 'NOT SCHEDULED' }}</span>
        </div>

        <div class="habit-actions">
          <button class="secondary-btn" :disabled="!habit.scheduledToday || habit.status === 'SKIPPED'" @click="emit('skip', habit.id)">Пропустить сегодня</button>
          <button class="text-btn" @click="emit('remove', habit.id)">Удалить</button>
          <span class="ratio-chip">🔥 {{ habit.currentStreak }} · рекорд {{ habit.bestStreak }}</span>
        </div>

        <div class="mini-track">
          <span
            v-for="day in habit.recentDays"
            :key="`${habit.id}-${day.date}`"
            class="mini-dot"
            :class="{
              due: day.scheduled,
              done: day.status === 'COMPLETED',
              skipped: day.status === 'SKIPPED',
              missed: day.status === 'MISSED'
            }"
            :title="`${day.date}: ${day.status || 'не запланировано'}`"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
