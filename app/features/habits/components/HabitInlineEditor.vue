<script setup lang="ts">
import { habitUpdateInputSchema, type HabitUpdateInput } from '~~/shared/schemas/habits'
import type { HabitDto, HabitScheduleType } from '~~/shared/types/habits'
import { HABIT_COLORS } from '~~/shared/utils/tracker'
import { useCategoriesQuery } from '../../organization/composables/useOrganizationQueries'

const props = defineProps<{
  habit: HabitDto
  pending?: boolean
}>()

const emit = defineEmits<{
  save: [input: HabitUpdateInput]
  cancel: []
}>()
const categoriesQuery = useCategoriesQuery()
const categoryOptions = computed(() => [
  { label: 'Без категории', value: null },
  ...(categoriesQuery.data.value ?? []).map((category) => ({ label: category.name, value: category.id }))
])

const scheduleOptions = [
  { label: 'Каждый день', value: 'EVERY_DAY' },
  { label: 'По дням недели', value: 'WEEKDAYS' },
  { label: 'Несколько раз в неделю', value: 'TIMES_PER_WEEK' },
  { label: 'Через интервал', value: 'INTERVAL' }
]
const weekdays = [
  { label: 'Пн', value: 1 }, { label: 'Вт', value: 2 }, { label: 'Ср', value: 3 },
  { label: 'Чт', value: 4 }, { label: 'Пт', value: 5 }, { label: 'Сб', value: 6 }, { label: 'Вс', value: 0 }
]
const iconOptions = [
  { label: 'Галочка', value: 'i-lucide-circle-check-big' },
  { label: 'Вода', value: 'i-lucide-droplets' },
  { label: 'Книга', value: 'i-lucide-book-open' },
  { label: 'Спорт', value: 'i-lucide-dumbbell' },
  { label: 'Язык', value: 'i-lucide-languages' },
  { label: 'Сон', value: 'i-lucide-moon' }
]

const state = reactive<HabitUpdateInput>({})

const iconModel = computed<string>({
  get: () => state.icon ?? '',
  set: (value) => { state.icon = value || null }
})
const descriptionModel = computed<string>({
  get: () => state.description ?? '',
  set: (value) => { state.description = value || null }
})
const targetModel = computed<number | undefined>({
  get: () => state.targetValue ?? undefined,
  set: (value) => { state.targetValue = value ?? null }
})
const unitModel = computed<string>({
  get: () => state.unit ?? '',
  set: (value) => { state.unit = value || null }
})
const timesPerWeekModel = computed<number | undefined>({
  get: () => state.schedule?.timesPerWeek ?? undefined,
  set: (value) => { if (state.schedule) state.schedule.timesPerWeek = value ?? null }
})
const intervalDaysModel = computed<number | undefined>({
  get: () => state.schedule?.intervalDays ?? undefined,
  set: (value) => { if (state.schedule) state.schedule.intervalDays = value ?? null }
})

function resetDraft() {
  Object.assign(state, {
    title: props.habit.title,
    description: props.habit.description,
    targetValue: props.habit.targetValue,
    unit: props.habit.unit,
    color: props.habit.color,
    icon: props.habit.icon,
    categoryId: props.habit.categoryId,
    schedule: {
      type: props.habit.schedule.type,
      weekdays: [...props.habit.schedule.weekdays],
      timesPerWeek: props.habit.schedule.timesPerWeek,
      intervalDays: props.habit.schedule.intervalDays,
      startDate: props.habit.schedule.startDate,
      endDate: props.habit.schedule.endDate
    }
  })
}

resetDraft()

watch(() => props.habit.updatedAt, resetDraft)

watch(() => state.schedule?.type, (type: HabitScheduleType | undefined, previous) => {
  if (!type || !previous || type === previous || !state.schedule) return
  state.schedule.weekdays = type === 'WEEKDAYS' ? [1, 3, 5] : []
  state.schedule.timesPerWeek = type === 'TIMES_PER_WEEK' ? 3 : null
  state.schedule.intervalDays = type === 'INTERVAL' ? 2 : null
})

function toggleWeekday(day: number) {
  if (!state.schedule) return
  state.schedule.weekdays = state.schedule.weekdays.includes(day)
    ? state.schedule.weekdays.filter((candidate) => candidate !== day)
    : [...state.schedule.weekdays, day]
}

function cancel() {
  resetDraft()
  emit('cancel')
}

function submit() {
  emit('save', habitUpdateInputSchema.parse(state))
}
</script>

<template>
  <UForm :schema="habitUpdateInputSchema" :state="state" class="inline-editor surface-card" @submit="submit">
    <div class="section-title"><div><h2>Редактирование</h2><p>Изменения сохранятся только после подтверждения.</p></div></div>
    <div class="form-grid">
      <UFormField label="Название" name="title" required><UInput v-model="state.title" maxlength="80" class="w-full" /></UFormField>
      <UFormField label="Иконка" name="icon"><USelect v-model="iconModel" :items="iconOptions" value-key="value" class="w-full" /></UFormField>
    </div>
    <UFormField label="Описание" name="description" hint="Необязательно"><UTextarea v-model="descriptionModel" maxlength="2000" autoresize class="w-full" /></UFormField>
    <UFormField label="Категория" name="categoryId"><USelect v-model="state.categoryId" :items="categoryOptions" value-key="value" class="w-full" /></UFormField>
    <div v-if="habit.trackingType !== 'BOOLEAN'" class="form-grid">
      <UFormField label="Цель" name="targetValue" required><UInput v-model.number="targetModel" type="number" min="0.001" step="0.001" class="w-full" /></UFormField>
      <UFormField label="Единица" name="unit" required><UInput v-model="unitModel" maxlength="20" class="w-full" /></UFormField>
    </div>
    <template v-if="state.schedule">
      <UFormField label="Расписание" name="schedule.type"><USelect v-model="state.schedule.type" :items="scheduleOptions" value-key="value" class="w-full" /></UFormField>
      <UFormField v-if="state.schedule.type === 'WEEKDAYS'" label="Дни недели" name="schedule.weekdays">
        <div class="weekday-buttons">
          <UButton v-for="day in weekdays" :key="day.value" type="button" :variant="state.schedule.weekdays.includes(day.value) ? 'solid' : 'soft'" :color="state.schedule.weekdays.includes(day.value) ? 'primary' : 'neutral'" :aria-pressed="state.schedule.weekdays.includes(day.value)" @click="toggleWeekday(day.value)">{{ day.label }}</UButton>
        </div>
      </UFormField>
      <UFormField v-if="state.schedule.type === 'TIMES_PER_WEEK'" label="Раз в неделю" name="schedule.timesPerWeek"><UInput v-model.number="timesPerWeekModel" type="number" min="1" max="7" class="w-full" /></UFormField>
      <UFormField v-if="state.schedule.type === 'INTERVAL'" label="Интервал в днях" name="schedule.intervalDays"><UInput v-model.number="intervalDaysModel" type="number" min="1" max="365" class="w-full" /></UFormField>
    </template>
    <UFormField label="Цвет" name="color">
      <div class="color-options" role="radiogroup" aria-label="Цвет привычки">
        <button v-for="color in HABIT_COLORS" :key="color" type="button" class="color-option" :class="{ selected: state.color === color }" :style="{ backgroundColor: color }" :aria-label="`Выбрать цвет ${color}`" :aria-checked="state.color === color" role="radio" @click="state.color = color" />
      </div>
    </UFormField>
    <div class="dialog-actions">
      <UButton type="button" color="neutral" variant="ghost" @click="cancel">Отмена</UButton>
      <UButton type="submit" icon="i-lucide-check" :loading="pending">Сохранить</UButton>
    </div>
  </UForm>
</template>
