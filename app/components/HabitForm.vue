<script setup lang="ts">
import { habitCreateInputSchema } from '~~/shared/schemas/habits'
import type { HabitCreateInput } from '~~/shared/schemas/habits'
import { getDateKey } from '~~/shared/utils/dates'
import { DEFAULT_HABIT_COLOR, HABIT_COLORS } from '~~/shared/utils/tracker'

const emit = defineEmits<{
  create: [payload: HabitCreateInput]
}>()

const form = reactive({
  title: '',
  description: '',
  frequency: 'daily',
  trackingType: 'BOOLEAN',
  target: 1,
  unit: 'раз',
  color: DEFAULT_HABIT_COLOR
})

function submit() {
  const numeric = form.trackingType !== 'BOOLEAN'
  const result = habitCreateInputSchema.safeParse({
    title: form.title,
    description: form.description || null,
    trackingType: form.trackingType,
    targetValue: numeric ? form.target : null,
    unit: numeric ? form.unit : null,
    color: form.color,
    schedule: {
      type: form.frequency === 'daily' ? 'DAILY' : 'WEEKLY',
      weekdays: [],
      timesPerWeek: form.frequency === 'weekly' ? 1 : null,
      intervalDays: null,
      startDate: getDateKey(new Date()),
      endDate: null
    }
  })

  if (!result.success) {
    return
  }

  emit('create', result.data)

  form.title = ''
  form.description = ''
  form.target = 1
}
</script>

<template>
  <section class="panel-card">
    <div class="section-head">
      <h2>Добавить привычку</h2>
      <p>Создай новую ежедневную или еженедельную цель.</p>
    </div>

    <form class="habit-form" @submit.prevent="submit">
      <label>
        Название привычки
        <input v-model="form.title" placeholder="Читать 30 минут" maxlength="80" required>
      </label>

      <label>
        Описание
        <textarea v-model="form.description" rows="2" placeholder="Необязательно" maxlength="160" />
      </label>

      <div class="inline-grid">
        <label>
          Тип учёта
          <select v-model="form.trackingType">
            <option value="BOOLEAN">Да / нет</option>
            <option value="COUNT">Количество</option>
            <option value="DURATION">Длительность</option>
            <option value="QUANTITY">Объём</option>
          </select>
        </label>

        <label>
          Частота
          <select v-model="form.frequency">
            <option value="daily">Каждый день</option>
            <option value="weekly">Раз в неделю</option>
          </select>
        </label>

        <label>
          Цель
          <input v-model.number="form.target" type="number" min="0.001" step="0.001" max="999999999" :disabled="form.trackingType === 'BOOLEAN'">
        </label>

        <label>
          Единица
          <input v-model="form.unit" placeholder="раз" maxlength="20" :disabled="form.trackingType === 'BOOLEAN'">
        </label>
      </div>

      <div class="color-picker-row">
        <span class="color-picker-label">Цвет</span>
        <div class="color-picker" role="radiogroup" aria-label="Выбор цвета привычки">
          <button
            v-for="color in HABIT_COLORS"
            :key="color"
            type="button"
            :aria-label="`Выбрать цвет ${color}`"
            :class="['color-dot', { selected: form.color === color }]"
            :style="{ backgroundColor: color }"
            @click="form.color = color"
          />
        </div>
      </div>

      <button type="submit" class="primary-btn">Добавить в трекер</button>
    </form>
  </section>
</template>
