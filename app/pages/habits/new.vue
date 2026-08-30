<script setup lang="ts">
import type { HabitCreateInput } from '~~/shared/schemas/habits'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { useHabitMutations } from '../../features/habits/composables/useHabitMutations'

const { user } = useUserSession()
const today = computed(() => getDateKeyInTimeZone(new Date(), user.value?.timezone || 'UTC'))
const { createMutation } = useHabitMutations()

async function create(input: HabitCreateInput) {
  const habit = await createMutation.mutateAsync(input)
  await navigateTo(`/habits/${habit.id}`)
}
</script>

<template>
  <div class="feature-page narrow-page">
    <header class="page-heading">
      <div><UButton to="/habits" color="neutral" variant="ghost" icon="i-lucide-arrow-left" class="back-button">Все привычки</UButton><h1>Новая привычка</h1><p>Сделайте действие понятным и достаточно простым для повторения.</p></div>
    </header>
    <HabitFormFields :today="today" :pending="createMutation.isPending.value" @submit="create" />
  </div>
</template>
