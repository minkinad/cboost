<script setup lang="ts">
import { habitCreateInputSchema, type HabitCreateInput } from '~~/shared/schemas/habits'
import type { HabitScheduleType, TrackingType } from '~~/shared/types/habits'
import { DEFAULT_HABIT_COLOR, HABIT_COLORS } from '~~/shared/utils/tracker'
import { useCategoriesQuery } from '../../organization/composables/useOrganizationQueries'

const props = defineProps<{
  today: string
  pending?: boolean
}>()

const emit = defineEmits<{
  submit: [input: HabitCreateInput]
}>()
const categoriesQuery = useCategoriesQuery()
const categoryOptions = computed(() => [
  { label: 'Без категории', value: null },
  ...(categoriesQuery.data.value ?? []).map((category) => ({ label: category.name, value: category.id }))
])

const trackingOptions = [
  { label: 'Да / нет', value: 'BOOLEAN' },
  { label: 'Количество', value: 'COUNT' },
  { label: 'Длительность', value: 'DURATION' },
  { label: 'Объём', value: 'QUANTITY' }
]
const scheduleOptions = [
  { label: 'Каждый день', value: 'EVERY_DAY' },
  { label: 'По дням недели', value: 'WEEKDAYS' },
  { label: 'Несколько раз в неделю', value: 'TIMES_PER_WEEK' },
  { label: 'Через интервал', value: 'INTERVAL' }
]
const weekdays = [
  { label: 'Пн', value: 1 },
  { label: 'Вт', value: 2 },
  { label: 'Ср', value: 3 },
  { label: 'Чт', value: 4 },
  { label: 'Пт', value: 5 },
  { label: 'Сб', value: 6 },
  { label: 'Вс', value: 0 }
]
const iconOptions = [
  { label: 'Галочка', value: 'i-lucide-circle-check-big' },
  { label: 'Вода', value: 'i-lucide-droplets' },
  { label: 'Книга', value: 'i-lucide-book-open' },
  { label: 'Спорт', value: 'i-lucide-dumbbell' },
  { label: 'Язык', value: 'i-lucide-languages' },
  { label: 'Сон', value: 'i-lucide-moon' }
]

const state = reactive<HabitCreateInput>({
  title: '',
  description: null,
  trackingType: 'BOOLEAN',
  targetValue: null,
  unit: null,
  color: DEFAULT_HABIT_COLOR,
  icon: 'i-lucide-circle-check-big',
  categoryId: null,
  schedule: {
    type: 'EVERY_DAY',
    weekdays: [],
    timesPerWeek: null,
    intervalDays: null,
    startDate: props.today,
    endDate: null
  }
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
  get: () => state.schedule.timesPerWeek ?? undefined,
  set: (value) => { state.schedule.timesPerWeek = value ?? null }
})
const intervalDaysModel = computed<number | undefined>({
  get: () => state.schedule.intervalDays ?? undefined,
  set: (value) => { state.schedule.intervalDays = value ?? null }
})
const iconModel = computed<string>({
  get: () => state.icon ?? '',
  set: (value) => { state.icon = value || null }
})

watch(() => state.trackingType, (trackingType: TrackingType) => {
  if (trackingType === 'BOOLEAN') {
    state.targetValue = null
    state.unit = null
    return
  }
  state.targetValue ??= trackingType === 'DURATION' ? 30 : 1
  state.unit ||= trackingType === 'DURATION' ? 'мин' : trackingType === 'COUNT' ? 'раз' : 'л'
})

watch(() => state.schedule.type, (type: HabitScheduleType) => {
  state.schedule.weekdays = type === 'WEEKDAYS' ? [1, 3, 5] : []
  state.schedule.timesPerWeek = type === 'TIMES_PER_WEEK' ? 3 : null
  state.schedule.intervalDays = type === 'INTERVAL' ? 2 : null
})

function toggleWeekday(day: number) {
  state.schedule.weekdays = state.schedule.weekdays.includes(day)
    ? state.schedule.weekdays.filter((candidate) => candidate !== day)
    : [...state.schedule.weekdays, day]
}

function submit() {
  emit('submit', habitCreateInputSchema.parse(state))
}
</script>

<template>
  <UForm :schema="habitCreateInputSchema" :state="state" class="habit-editor-form" @submit="submit">
    <section class="form-section surface-card">
      <div class="form-section-heading">
        <span>1</span>
        <div><h2>Основное</h2><p>Короткое название легче замечать каждый день.</p></div>
      </div>
      <UFormField label="Название" name="title" required>
        <UInput v-model="state.title" size="xl" maxlength="80" placeholder="Например, Читать" autofocus class="w-full" />
      </UFormField>
      <UFormField label="Описание" name="description" hint="Необязательно">
        <UTextarea v-model="descriptionModel" :rows="3" maxlength="2000" placeholder="Зачем эта привычка важна?" class="w-full" />
      </UFormField>
      <UFormField label="Категория" name="categoryId" hint="Создать категории можно в настройках">
        <USelect v-model="state.categoryId" :items="categoryOptions" value-key="value" size="lg" class="w-full" />
      </UFormField>
    </section>

    <section class="form-section surface-card">
      <div class="form-section-heading">
        <span>2</span>
        <div><h2>Как отслеживать</h2><p>Форма прогресса определяет быстрые действия.</p></div>
      </div>
      <UFormField label="Тип учёта" name="trackingType">
        <USelect v-model="state.trackingType" :items="trackingOptions" value-key="value" size="lg" class="w-full" />
      </UFormField>
      <div v-if="state.trackingType !== 'BOOLEAN'" class="form-grid">
        <UFormField :label="state.trackingType === 'DURATION' ? 'Цель по времени' : 'Цель'" name="targetValue" required>
          <UInput v-model.number="targetModel" type="number" min="0.001" step="0.001" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Единица" name="unit" required>
          <UInput v-model="unitModel" maxlength="20" placeholder="мин, раз, л" size="lg" class="w-full" />
        </UFormField>
      </div>
    </section>

    <section class="form-section surface-card">
      <div class="form-section-heading">
        <span>3</span>
        <div><h2>Расписание</h2><p>Прогресс и серии считают только запланированные дни.</p></div>
      </div>
      <UFormField label="Повторение" name="schedule.type">
        <USelect v-model="state.schedule.type" :items="scheduleOptions" value-key="value" size="lg" class="w-full" />
      </UFormField>

      <UFormField v-if="state.schedule.type === 'WEEKDAYS'" label="Дни недели" name="schedule.weekdays">
        <div class="weekday-buttons" role="group" aria-label="Дни недели">
          <UButton
            v-for="day in weekdays"
            :key="day.value"
            type="button"
            :variant="state.schedule.weekdays.includes(day.value) ? 'solid' : 'soft'"
            :color="state.schedule.weekdays.includes(day.value) ? 'primary' : 'neutral'"
            :aria-pressed="state.schedule.weekdays.includes(day.value)"
            @click="toggleWeekday(day.value)"
          >{{ day.label }}</UButton>
        </div>
      </UFormField>

      <UFormField v-if="state.schedule.type === 'TIMES_PER_WEEK'" label="Раз в неделю" name="schedule.timesPerWeek">
        <UInput v-model.number="timesPerWeekModel" type="number" min="1" max="7" size="lg" class="w-full" />
      </UFormField>

      <UFormField v-if="state.schedule.type === 'INTERVAL'" label="Интервал в днях" name="schedule.intervalDays">
        <UInput v-model.number="intervalDaysModel" type="number" min="1" max="365" size="lg" class="w-full" />
      </UFormField>
    </section>

    <section class="form-section surface-card">
      <div class="form-section-heading">
        <span>4</span>
        <div><h2>Внешний вид</h2><p>Цвет остаётся небольшим акцентом, не меняя интерфейс целиком.</p></div>
      </div>
      <UFormField label="Иконка" name="icon">
        <USelect v-model="iconModel" :items="iconOptions" value-key="value" size="lg" class="w-full">
          <template #leading><UIcon :name="state.icon || 'i-lucide-circle-check-big'" class="size-5" /></template>
        </USelect>
      </UFormField>
      <UFormField label="Цвет" name="color">
        <div class="color-options" role="radiogroup" aria-label="Цвет привычки">
          <button
            v-for="color in HABIT_COLORS"
            :key="color"
            type="button"
            class="color-option"
            :class="{ selected: state.color === color }"
            :style="{ backgroundColor: color }"
            :aria-label="`Выбрать цвет ${color}`"
            :aria-checked="state.color === color"
            role="radio"
            @click="state.color = color"
          />
        </div>
      </UFormField>
    </section>

    <div class="form-submit-bar">
      <UButton to="/habits" color="neutral" variant="ghost" size="lg">Отмена</UButton>
      <UButton type="submit" icon="i-lucide-check" size="lg" :loading="pending">Создать привычку</UButton>
    </div>
  </UForm>
</template>
