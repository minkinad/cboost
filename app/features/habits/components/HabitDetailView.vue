<script setup lang="ts">
import type { HabitEntryPutInput, HabitUpdateInput } from '~~/shared/schemas/habits'
import { getDateKeyInTimeZone } from '~~/shared/utils/dates'
import { useHabitAnalyticsQuery } from '../../progress/composables/useAnalyticsQueries'
import { useHabitMutations } from '../composables/useHabitMutations'
import { useHabitQuery } from '../composables/useHabitQueries'
import { formatLongDate, formatNumber, formatSchedule, trackingLabels } from '../model/habit-presenters'

const props = defineProps<{ habitId: string }>()
const { user } = useUserSession()
const today = computed(() => getDateKeyInTimeZone(new Date(), user.value?.timezone || 'UTC'))
const habitQuery = useHabitQuery(props.habitId)
const analyticsQuery = useHabitAnalyticsQuery(props.habitId)
const habit = computed(() => habitQuery.data.value)
const analytics = computed(() => analyticsQuery.data.value)
const editing = ref(false)
const deleteOpen = ref(false)
const archiveOpen = ref(false)
const {
  entryMutation,
  updateMutation,
  archiveMutation,
  restoreMutation,
  deleteMutation
} = useHabitMutations()

const recentEntries = computed(() => [...(habit.value?.entries ?? [])].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 8))

async function save(input: HabitUpdateInput) {
  await updateMutation.mutateAsync({ habitId: props.habitId, input })
  editing.value = false
}

function record(input: HabitEntryPutInput) {
  entryMutation.mutate({ habitId: props.habitId, date: today.value, input })
}

async function archive() {
  await archiveMutation.mutateAsync(props.habitId)
  archiveOpen.value = false
  await navigateTo('/habits')
}

async function remove() {
  await deleteMutation.mutateAsync(props.habitId)
  await navigateTo('/habits')
}
</script>

<template>
  <div class="feature-page detail-page">
    <div v-if="habitQuery.isPending.value" class="detail-skeleton">
      <USkeleton class="h-8 w-52" /><USkeleton class="h-28 w-full" /><USkeleton class="h-64 w-full" />
    </div>
    <UAlert v-else-if="habitQuery.isError.value" color="error" variant="subtle" title="Привычка не найдена" description="Возможно, она была удалена или недоступна." />
    <template v-else-if="habit">
      <header class="detail-heading">
        <div>
          <UButton to="/habits" color="neutral" variant="ghost" icon="i-lucide-arrow-left" class="back-button">Все привычки</UButton>
          <div class="detail-title-row">
            <div class="detail-icon" :style="{ backgroundColor: `${habit.color || '#315c4c'}18`, color: habit.color || '#315c4c' }"><UIcon :name="habit.icon || 'i-lucide-circle-check-big'" class="size-7" /></div>
            <div><h1>{{ habit.title }}</h1><p>{{ habit.description || 'Описание пока не добавлено.' }}</p></div>
          </div>
        </div>
        <div class="detail-actions">
          <UBadge v-if="habit.archivedAt" color="neutral" size="lg">В архиве</UBadge>
          <UButton icon="i-lucide-pencil" color="neutral" variant="soft" @click="editing = !editing">{{ editing ? 'Закрыть' : 'Изменить' }}</UButton>
          <UButton v-if="habit.archivedAt" icon="i-lucide-rotate-ccw" @click="restoreMutation.mutate(habit.id)">Восстановить</UButton>
          <UButton v-else icon="i-lucide-archive" color="neutral" variant="soft" @click="archiveOpen = true">В архив</UButton>
        </div>
      </header>

      <HabitInlineEditor v-if="editing" :habit="habit" :pending="updateMutation.isPending.value" @save="save" @cancel="editing = false" />

      <TodayHabitCard v-if="!habit.archivedAt" :habit="habit" :today="today" :saving="entryMutation.isPending.value" @record="record" />

      <section v-if="analytics" class="metric-grid" aria-label="Статистика привычки">
        <div class="surface-card metric-card"><UIcon name="i-lucide-flame" /><span>Текущая серия</span><strong>{{ analytics.currentStreak }}</strong><small>выполнений</small></div>
        <div class="surface-card metric-card"><UIcon name="i-lucide-trophy" /><span>Лучшая серия</span><strong>{{ analytics.bestStreak }}</strong><small>выполнений</small></div>
        <div class="surface-card metric-card"><UIcon name="i-lucide-chart-pie" /><span>За 30 дней</span><strong>{{ analytics.completion30Days }}%</strong><small>запланированных</small></div>
      </section>

      <div class="detail-grid">
        <section class="surface-card detail-panel">
          <div class="section-title"><div><h2>Последние 30 дней</h2><p>Только дни, относящиеся к расписанию.</p></div></div>
          <div class="calendar-grid" aria-label="Календарь выполнения за 30 дней">
            <div v-for="day in analytics?.history30Days ?? []" :key="day.date" class="calendar-day" :class="day.status?.toLowerCase()" :title="`${formatLongDate(day.date)}: ${day.status || 'не запланировано'}`"><span>{{ Number(day.date.slice(-2)) }}</span></div>
          </div>
          <div class="calendar-legend"><span><i class="completed" /> Выполнено</span><span><i class="partial" /> Частично</span><span><i class="missed" /> Пропущено</span><span><i class="skipped" /> Skip</span></div>
        </section>

        <section class="surface-card detail-panel habit-facts">
          <div class="section-title"><div><h2>Параметры</h2><p>Как привычка входит в план.</p></div></div>
          <dl><div><dt>Тип</dt><dd>{{ trackingLabels[habit.trackingType] }}</dd></div><div v-if="habit.trackingType !== 'BOOLEAN'"><dt>Цель</dt><dd>{{ formatNumber(habit.targetValue) }} {{ habit.unit }}</dd></div><div><dt>Расписание</dt><dd>{{ formatSchedule(habit.schedule) }}</dd></div><div><dt>Старт</dt><dd>{{ habit.schedule.startDate }}</dd></div></dl>
        </section>
      </div>

      <section v-if="analytics?.numeric" class="surface-card detail-panel">
        <div class="section-title"><div><h2>Значения за 90 дней</h2><p>Средние рассчитаны по ожидаемым scheduled days; skip исключён.</p></div></div>
        <div class="metric-grid"><div class="metric-card"><span>Среднее значение</span><strong>{{ formatNumber(analytics.numeric.averageValue) }} {{ habit.unit }}</strong></div><div class="metric-card"><span>Достижение цели</span><strong>{{ analytics.numeric.averageTargetAchievement }}%</strong></div><div class="metric-card"><span>Лучший день</span><strong>{{ analytics.numeric.bestDay ? `${formatNumber(analytics.numeric.bestDay.value)} ${habit.unit}` : '—' }}</strong><small>{{ analytics.numeric.bestDay?.date || '' }}</small></div></div>
      </section>

      <section class="surface-card detail-panel">
        <div class="section-title"><div><h2>Последние записи</h2><p>Недавние изменения прогресса.</p></div></div>
        <div v-if="recentEntries.length" class="entry-list">
          <div v-for="entry in recentEntries" :key="entry.id" class="entry-row"><time :datetime="entry.date">{{ entry.date }}</time><UBadge :color="entry.status === 'COMPLETED' ? 'success' : entry.status === 'SKIPPED' ? 'neutral' : 'warning'" variant="soft">{{ entry.status }}</UBadge><strong>{{ habit.trackingType === 'BOOLEAN' ? '—' : `${formatNumber(entry.value)} ${habit.unit}` }}</strong><span>{{ entry.note || '' }}</span></div>
        </div>
        <p v-else class="muted-empty">Записей пока нет.</p>
      </section>

      <section class="danger-zone">
        <div><h2>Удаление</h2><p>Hard delete навсегда удалит привычку вместе с историей.</p></div>
        <UButton color="error" variant="soft" icon="i-lucide-trash-2" @click="deleteOpen = true">Удалить навсегда</UButton>
      </section>

      <UModal v-model:open="archiveOpen" title="Архивировать привычку?" description="Она исчезнет из Today, но история сохранится.">
        <template #body><div class="dialog-actions"><UButton color="neutral" variant="ghost" @click="archiveOpen = false">Отмена</UButton><UButton icon="i-lucide-archive" :loading="archiveMutation.isPending.value" @click="archive">В архив</UButton></div></template>
      </UModal>
      <UModal v-model:open="deleteOpen" title="Удалить навсегда?" description="Это действие нельзя отменить. Все записи и серии будут удалены.">
        <template #body><div class="dialog-actions"><UButton color="neutral" variant="ghost" @click="deleteOpen = false">Отмена</UButton><UButton color="error" icon="i-lucide-trash-2" :loading="deleteMutation.isPending.value" @click="remove">Удалить</UButton></div></template>
      </UModal>
    </template>
  </div>
</template>
