<script setup lang="ts">
import type { HabitDto } from '~~/shared/types/habits'
import { formatSchedule, progressLabel, trackingLabels } from '../model/habit-presenters'

defineProps<{
  habit: HabitDto
  today: string
  currentStreak?: number
  categoryName?: string
  pending?: boolean
}>()

const emit = defineEmits<{
  archive: []
  restore: []
}>()

</script>

<template>
  <article class="surface-card overview-card" :data-testid="`habit-card-${habit.id}`">
    <span class="habit-accent" :style="{ backgroundColor: habit.color || '#315c4c' }" />
    <div class="overview-icon" :style="{ color: habit.color || '#315c4c' }">
      <UIcon :name="habit.icon || 'i-lucide-circle-check-big'" class="size-5" />
    </div>
    <div class="overview-main">
      <NuxtLink :to="`/habits/${habit.id}`" class="habit-title-link">{{ habit.title }}</NuxtLink>
      <div class="overview-meta">
        <UBadge color="neutral" variant="soft">{{ trackingLabels[habit.trackingType] }}</UBadge>
        <UBadge v-if="categoryName" color="primary" variant="soft">{{ categoryName }}</UBadge>
        <span>{{ formatSchedule(habit.schedule) }}</span>
      </div>
      <p v-if="!habit.archivedAt">Сегодня: <strong>{{ progressLabel(habit, today) }}</strong></p>
      <p v-else>Архивирована {{ new Date(habit.archivedAt).toLocaleDateString('ru-RU') }}</p>
    </div>
    <div class="overview-streak">
      <UIcon name="i-lucide-flame" class="size-5" />
      <strong>{{ currentStreak ?? 0 }}</strong>
      <span>серия</span>
    </div>
    <div class="overview-actions">
      <UButton :to="`/habits/${habit.id}`" color="neutral" variant="ghost" icon="i-lucide-chevron-right" :aria-label="`Открыть ${habit.title}`" />
      <UButton
        v-if="habit.archivedAt"
        color="neutral"
        variant="soft"
        icon="i-lucide-rotate-ccw"
        :loading="pending"
        :aria-label="`Восстановить ${habit.title}`"
        @click="emit('restore')"
      >Восстановить</UButton>
      <UTooltip v-else text="Архивировать">
        <UButton color="neutral" variant="ghost" icon="i-lucide-archive" :loading="pending" :aria-label="`Архивировать ${habit.title}`" @click="emit('archive')" />
      </UTooltip>
    </div>
  </article>
</template>
