<script setup lang="ts">
import type { HabitCreateInput } from '~~/shared/schemas/habits'

const { user, fetch: refreshSession } = useUserSession()

const {
  habitItems,
  stats,
  source,
  errorMessage,
  todayKey,
  todayProgress,
  init,
  addHabit,
  deleteHabit,
  toggleHabit,
  adjustHabit,
  skipHabit
} = useTracker()

const {
  permission,
  notificationsSupported,
  refreshPermission,
  requestPermission,
  maybeSendReminder,
  start,
  stop,
  pickMessage
} = useMotivationReminder()

const motivationalText = computed(() => {
  if (!todayProgress.value.pending) {
    return 'На сегодня все закрыто. Зафиксируй серию и сохрани темп.'
  }

  return pickMessage(todayProgress.value.pending)
})

async function handleCreate(payload: HabitCreateInput) {
  await addHabit(payload)
  maybeSendReminder(todayProgress.value.pending)
}

async function handleToggle(habitId: string) {
  await toggleHabit(habitId)
}

async function handleRemove(habitId: string) {
  await deleteHabit(habitId)
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}

onMounted(async () => {
  await init()

  refreshPermission()
  start(() => todayProgress.value.pending)
  maybeSendReminder(todayProgress.value.pending)
})

onBeforeUnmount(() => {
  stop()
})
</script>

<template>
  <main class="page-shell">
    <div class="account-bar">
      <span>{{ user?.displayName || user?.email }}</span>
      <button class="text-btn" type="button" @click="logout">Выйти</button>
    </div>
    <HeaderHero
      :completed="todayProgress.completed"
      :expected="todayProgress.expected"
      :pending="todayProgress.pending"
      :data-source="source"
      :today-key="todayKey"
    />

    <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

    <div class="top-grid">
      <HabitForm :today-key="todayKey" @create="handleCreate" />
      <MotivationCard
        :message="motivationalText"
        :pending="todayProgress.pending"
        :notifications-supported="notificationsSupported"
        :permission="permission"
        @request="requestPermission"
      />
    </div>

    <div class="main-grid">
      <HabitList
        :habits="habitItems"
        @toggle="handleToggle"
        @increment="adjustHabit($event, 1)"
        @decrement="adjustHabit($event, -1)"
        @skip="skipHabit"
        @remove="handleRemove"
      />

      <div class="side-stack">
        <StatsOverview :stats="stats" />
        <HeatmapPanel :series="stats.dailySeries" />
      </div>
    </div>
  </main>
</template>
