<script setup lang="ts">
defineProps<{
  completed: number
  expected: number
  pending: number
  dataSource: 'local' | 'server'
  todayKey: string
}>()
</script>

<template>
  <section class="hero-card">
    <div>
      <p class="eyebrow">DailyBoost</p>
      <h1>Собирай стабильность без перегруза.</h1>
      <p class="hero-copy">
        Отслеживай ежедневные и еженедельные привычки, смотри прогресс в реальном времени и сохраняй фокус с мягкими
        напоминаниями.
      </p>
    </div>

    <div class="hero-metrics">
      <p class="hero-date">{{ todayKey }}</p>
      <p class="hero-progress">{{ completed }} / {{ expected }} выполнено сегодня</p>
      <p class="hero-pending">Осталось: {{ pending }}</p>
      <span class="source-chip">Режим: {{ dataSource === 'server' ? 'Серверный API' : 'Локальный (GitHub Pages)' }}</span>
    </div>
  </section>
</template>
