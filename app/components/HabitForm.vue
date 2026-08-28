<script setup lang="ts">
import { habitCreateInputSchema } from '~~/shared/schemas/habits'
import type { HabitCreateInput } from '~~/shared/schemas/habits'
import { DEFAULT_HABIT_COLOR, HABIT_COLORS } from '~~/shared/utils/tracker'

const props = defineProps<{
  todayKey: string
}>()

const emit = defineEmits<{
  create: [payload: HabitCreateInput]
}>()

const form = reactive({
  title: '',
  description: '',
  scheduleType: 'EVERY_DAY',
  weekdays: [1, 3, 5] as number[],
  timesPerWeek: 3,
  intervalDays: 2,
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
      type: form.scheduleType,
      weekdays: form.scheduleType === 'WEEKDAYS' ? form.weekdays : [],
      timesPerWeek: form.scheduleType === 'TIMES_PER_WEEK' ? form.timesPerWeek : null,
      intervalDays: form.scheduleType === 'INTERVAL' ? form.intervalDays : null,
      startDate: props.todayKey,
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
          Расписание
          <select v-model="form.scheduleType">
            <option value="EVERY_DAY">Каждый день</option>
            <option value="WEEKDAYS">По дням недели</option>
            <option value="TIMES_PER_WEEK">Несколько раз в неделю</option>
            <option value="INTERVAL">Через интервал дней</option>
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

      <fieldset v-if="form.scheduleType === 'WEEKDAYS'">
        <legend>Дни недели</legend>
        <div class="weekday-picker">
          <label v-for="day in [{ value: 1, label: 'Пн' }, { value: 2, label: 'Вт' }, { value: 3, label: 'Ср' }, { value: 4, label: 'Чт' }, { value: 5, label: 'Пт' }, { value: 6, label: 'Сб' }, { value: 0, label: 'Вс' }]" :key="day.value" class="weekday-option">
            <input v-model="form.weekdays" type="checkbox" :value="day.value">
            {{ day.label }}
          </label>
        </div>
      </fieldset>

      <label v-if="form.scheduleType === 'TIMES_PER_WEEK'">
        Выполнений в неделю
        <input v-model.number="form.timesPerWeek" type="number" min="1" max="7">
      </label>

      <label v-if="form.scheduleType === 'INTERVAL'">
        Интервал в днях
        <input v-model.number="form.intervalDays" type="number" min="1" max="365">
      </label>

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
