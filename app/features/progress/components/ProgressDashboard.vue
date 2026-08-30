<script setup lang="ts">
import { useAnalyticsOverviewQuery } from '../composables/useAnalyticsQueries'

const analyticsQuery = useAnalyticsOverviewQuery()
const analytics = computed(() => analyticsQuery.data.value)
const statusCards = computed(() => analytics.value ? [
  { label: 'Выполнено', value: analytics.value.statusTotals.COMPLETED, icon: 'i-lucide-circle-check-big', tone: 'completed' },
  { label: 'Частично', value: analytics.value.statusTotals.PARTIAL, icon: 'i-lucide-circle-dot', tone: 'partial' },
  { label: 'Skip', value: analytics.value.statusTotals.SKIPPED, icon: 'i-lucide-forward', tone: 'skipped' },
  { label: 'Пропущено', value: analytics.value.statusTotals.MISSED, icon: 'i-lucide-circle-x', tone: 'missed' }
] : [])
const changeLabel = computed(() => {
  const value = analytics.value?.changePercentagePoints ?? 0
  return `${value > 0 ? '+' : ''}${value} п.п.`
})
</script>

<template>
  <div class="feature-page">
    <header class="page-heading"><div><p class="page-kicker">Персональная аналитика</p><h1>Прогресс</h1><p>Все показатели рассчитаны по запланированным привычкам.</p></div></header>
    <div v-if="analyticsQuery.isPending.value" class="metric-grid"><USkeleton v-for="index in 4" :key="index" class="h-32 rounded-2xl" /></div>
    <UAlert v-else-if="analyticsQuery.isError.value" color="error" variant="subtle" title="Не удалось загрузить аналитику" />
    <template v-else-if="analytics">
      <section class="metric-grid progress-metrics">
        <div class="surface-card metric-card"><UIcon name="i-lucide-calendar-check" /><span>Эта неделя</span><strong>{{ analytics.currentWeek.rate }}%</strong><small>{{ analytics.currentWeek.completed }} из {{ analytics.currentWeek.expected }}</small></div>
        <div class="surface-card metric-card"><UIcon name="i-lucide-calendar-range" /><span>Прошлая неделя</span><strong>{{ analytics.previousWeek.rate }}%</strong><small>{{ analytics.previousWeek.completed }} из {{ analytics.previousWeek.expected }}</small></div>
        <div class="surface-card metric-card"><UIcon name="i-lucide-trending-up" /><span>Изменение</span><strong>{{ changeLabel }}</strong><small>процентных пунктов</small></div>
      </section>
      <section class="status-metric-grid" aria-label="Статусы за текущую неделю">
        <div v-for="item in statusCards" :key="item.label" class="surface-card status-metric" :class="item.tone"><UIcon :name="item.icon" /><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
      </section>
      <section class="surface-card detail-panel">
        <div class="section-title"><div><h2>Последние 90 дней</h2><p>Интенсивность — доля выполненных привычек от ожидаемых в этот день.</p></div></div>
        <div class="analytics-heatmap" aria-label="Heatmap выполнения за 90 дней">
          <div v-for="day in analytics.heatmap" :key="day.date" class="analytics-heatmap-day" :class="`intensity-${day.intensity}`" :title="`${day.date}: ${day.rate}% (${day.completed}/${day.expected})`" />
        </div>
        <div class="heatmap-legend"><span>0%</span><i v-for="level in 6" :key="level" :class="`intensity-${level - 1}`" /><span>100%</span></div>
      </section>
      <div class="analytics-layout">
        <section class="surface-card detail-panel">
          <div class="section-title"><div><h2>По дням недели</h2><p>За последние 90 дней.</p></div></div>
          <div class="weekday-analysis"><div v-for="day in analytics.weekdays" :key="day.weekday" class="weekday-row"><span>{{ day.label }}</span><div><i :style="{ width: `${day.rate}%` }" /></div><strong>{{ day.rate }}%</strong></div></div>
        </section>
        <section class="surface-card detail-panel weekly-review">
          <div class="section-title"><div><h2>Ваша неделя</h2><p>Только факты из записей и расписаний.</p></div></div>
          <div class="review-overall"><strong>{{ analytics.weeklyReview.overall }}%</strong><span>{{ changeLabel }} к прошлой неделе</span></div>
          <div v-if="analytics.weeklyReview.strongestHabits.length" class="review-block"><h3>Сильные привычки</h3><p v-for="habit in analytics.weeklyReview.strongestHabits" :key="habit.habitId">{{ habit.title }} — {{ habit.rate }}%</p></div>
          <div v-if="analytics.weeklyReview.needsAttention.length" class="review-block"><h3>Требуют внимания</h3><p v-for="habit in analytics.weeklyReview.needsAttention" :key="habit.habitId">{{ habit.title }} — {{ habit.rate }}%</p></div>
          <div v-if="analytics.weeklyReview.pattern" class="review-block"><h3>Паттерн</h3><p>{{ analytics.weeklyReview.pattern.statement }}</p></div>
          <div v-if="analytics.weeklyReview.longestStreak" class="review-block"><h3>Самая длинная текущая серия</h3><p>{{ analytics.weeklyReview.longestStreak.title }} — {{ analytics.weeklyReview.longestStreak.streak }}</p></div>
        </section>
      </div>
      <section class="surface-card detail-panel">
        <div class="section-title"><div><h2>Привычки</h2><p>Серии и completion rate по фиксированным периодам.</p></div></div>
        <div v-if="analytics.habits.length" class="habit-analytics-table">
          <NuxtLink v-for="habit in analytics.habits" :key="habit.habitId" :to="`/habits/${habit.habitId}`" class="habit-analytics-row"><strong>{{ habit.title }}</strong><span>🔥 {{ habit.currentStreak }}</span><span>Best {{ habit.bestStreak }}</span><span>7d {{ habit.completion7Days }}%</span><span>30d {{ habit.completion30Days }}%</span><span>90d {{ habit.completion90Days }}%</span></NuxtLink>
        </div>
        <p v-else class="muted-empty">Создайте привычку, чтобы увидеть аналитику.</p>
      </section>
    </template>
  </div>
</template>
