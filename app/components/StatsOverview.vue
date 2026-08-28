<script setup lang="ts">
import type { TrackerStats } from '~~/shared/types/tracker'

defineProps<{
  stats: TrackerStats
}>()
</script>

<template>
  <section class="panel-card stats-panel">
    <div class="section-head">
      <h2>Аналитика прогресса</h2>
      <p>Качество выполнения за неделю и месяц.</p>
    </div>

    <div class="stats-grid">
      <article class="stat-box">
        <p class="stat-label">Выполнение за неделю</p>
        <p class="stat-value">{{ stats.weekCompletionRate }}%</p>
        <p class="stat-note">{{ stats.weekCompleted }} / {{ stats.weekExpected }} отметок</p>
        <div class="progress-track">
          <span class="progress-fill" :style="{ width: `${stats.weekCompletionRate}%` }" />
        </div>
      </article>

      <article class="stat-box">
        <p class="stat-label">Выполнение за месяц</p>
        <p class="stat-value">{{ stats.monthCompletionRate }}%</p>
        <p class="stat-note">{{ stats.monthCompleted }} / {{ stats.monthExpected }} отметок</p>
        <div class="progress-track">
          <span class="progress-fill warm" :style="{ width: `${stats.monthCompletionRate}%` }" />
        </div>
      </article>

      <article class="stat-box compact">
        <p class="stat-label">Серия идеальных дней</p>
        <p class="stat-value">{{ stats.perfectDayStreak }}</p>
        <p class="stat-note">все обязательные привычки выполнены</p>
      </article>

      <article class="stat-box compact">
        <p class="stat-label">Лучшая привычка</p>
        <p class="stat-value small">{{ stats.bestHabit?.title || 'Пока мало данных' }}</p>
        <p class="stat-note">текущая {{ stats.bestHabit?.currentStreak || 0 }} · рекорд {{ stats.bestHabit?.bestStreak || 0 }}</p>
      </article>
    </div>
  </section>
</template>
