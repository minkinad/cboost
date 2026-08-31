<script setup lang="ts">
import { reminderCreateInputSchema, type ReminderCreateInput } from '~~/shared/schemas/reminders'
import { useReminderMutations } from '../composables/useReminderMutations'
import { useRemindersQuery } from '../composables/useReminderQueries'

const props = defineProps<{ habitId: string; timezone: string }>()
const remindersQuery = useRemindersQuery(props.habitId)
const { createReminder, updateReminder, deleteReminder } = useReminderMutations(props.habitId)
const state = reactive<ReminderCreateInput>({ time: '09:00', timezone: props.timezone, enabled: true })
const permission = ref<NotificationPermission | 'unsupported'>('unsupported')

onMounted(() => {
  permission.value = 'Notification' in window ? Notification.permission : 'unsupported'
})

async function requestPermission() {
  if (!('Notification' in window)) return
  permission.value = await Notification.requestPermission()
}

async function create() {
  await createReminder.mutateAsync(reminderCreateInputSchema.parse(state))
}
</script>

<template>
  <section class="surface-card detail-panel reminder-panel">
    <div class="section-title"><div><h2>Напоминания</h2><p>Время хранится вместе с IANA timezone.</p></div><UBadge color="neutral" variant="soft">{{ remindersQuery.data.value?.length ?? 0 }}</UBadge></div>
    <UAlert v-if="permission !== 'granted'" color="neutral" variant="subtle" icon="i-lucide-bell" title="Уведомления выключены" description="DailyBoost запросит разрешение только после вашего нажатия.">
      <template #actions><UButton size="sm" variant="soft" :disabled="permission === 'unsupported'" @click="requestPermission">Разрешить уведомления</UButton></template>
    </UAlert>
    <UAlert v-else color="success" variant="subtle" icon="i-lucide-bell-ring" title="Уведомления разрешены" description="Browser reminders работают, пока приложение запущено. Гарантированная доставка потребует Push/production scheduler." />
    <UForm :schema="reminderCreateInputSchema" :state="state" class="reminder-form" @submit="create">
      <UFormField label="Время" name="time"><UInput v-model="state.time" type="time" /></UFormField>
      <UButton type="submit" icon="i-lucide-plus" :loading="createReminder.isPending.value">Добавить</UButton>
    </UForm>
    <div v-if="remindersQuery.data.value?.length" class="reminder-list">
      <div v-for="reminder in remindersQuery.data.value" :key="reminder.id" class="reminder-row">
        <UIcon name="i-lucide-clock-3" /><strong>{{ reminder.time }}</strong><span>{{ reminder.timezone }}</span>
        <USwitch :model-value="reminder.enabled" :aria-label="`Включить напоминание ${reminder.time}`" @update:model-value="updateReminder.mutate({ id: reminder.id, input: { enabled: $event } })" />
        <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="sm" :aria-label="`Удалить напоминание ${reminder.time}`" @click="deleteReminder.mutate(reminder.id)" />
      </div>
    </div>
    <p v-else-if="!remindersQuery.isPending.value" class="muted-empty">Напоминаний пока нет.</p>
  </section>
</template>
