<script setup lang="ts">
import { getEntryStatusForDate } from '~~/shared/domain/habits'
import type { HabitEntryPutInput } from '~~/shared/schemas/habits'
import type { HabitDto } from '~~/shared/types/habits'
import { entryForDate, formatNumber, quickStep } from '../../habits/model/habit-presenters'

const props = defineProps<{
  habit: HabitDto
  today: string
  saving?: boolean
}>()

const emit = defineEmits<{
  record: [input: HabitEntryPutInput]
}>()

const skipOpen = ref(false)
const skipNote = ref('')
const status = computed(() => getEntryStatusForDate(props.habit, props.today, props.today))
const entry = computed(() => entryForDate(props.habit, props.today))
const value = computed(() => entry.value?.value ?? 0)
const directValue = ref(value.value)
const step = computed(() => quickStep(props.habit.trackingType))
const complete = computed(() => status.value === 'COMPLETED')
const skipped = computed(() => status.value === 'SKIPPED')
const progress = computed(() => {
  if (props.habit.trackingType === 'BOOLEAN') return complete.value ? 100 : 0
  return Math.min(100, Math.round((value.value / (props.habit.targetValue || 1)) * 100))
})

watch(value, (next) => {
  directValue.value = next
})

function toggleBoolean() {
  emit('record', { completed: !complete.value })
}

function adjust(direction: -1 | 1) {
  const next = Math.max(0, value.value + step.value * direction)
  emit('record', { value: Number(next.toFixed(3)) })
}

function saveDirectValue() {
  const next = Number(directValue.value)
  if (!Number.isFinite(next) || next < 0 || next === value.value) return
  emit('record', { value: Number(next.toFixed(3)) })
}

function submitSkip() {
  emit('record', { status: 'SKIPPED', note: skipNote.value.trim() || null })
  skipOpen.value = false
  skipNote.value = ''
}
</script>

<template>
  <article class="surface-card today-habit" :class="{ completed: complete, skipped }" :data-testid="`today-habit-${habit.id}`">
    <span class="habit-accent" :style="{ backgroundColor: habit.color || '#315c4c' }" />
    <div class="today-habit-copy">
      <div class="habit-icon" :style="{ color: habit.color || '#315c4c' }">
        <UIcon :name="habit.icon || 'i-lucide-circle-check-big'" class="size-5" />
      </div>
      <div>
        <NuxtLink :to="`/habits/${habit.id}`" class="habit-title-link">{{ habit.title }}</NuxtLink>
        <p v-if="habit.trackingType === 'BOOLEAN'">{{ complete ? 'Выполнено' : skipped ? 'Пропущено' : 'Одно нажатие — готово' }}</p>
        <p v-else>{{ formatNumber(value) }} / {{ formatNumber(habit.targetValue) }} {{ habit.unit }}</p>
      </div>
    </div>

    <div class="today-habit-action">
      <UButton
        v-if="habit.trackingType === 'BOOLEAN'"
        :icon="complete ? 'i-lucide-check' : 'i-lucide-circle'"
        :color="complete ? 'success' : 'primary'"
        :variant="complete ? 'soft' : 'solid'"
        size="lg"
        :disabled="skipped"
        :loading="saving"
        :aria-label="complete ? `Отменить выполнение: ${habit.title}` : `Выполнить: ${habit.title}`"
        @click="toggleBoolean"
      >
        {{ complete ? 'Готово' : 'Выполнить' }}
      </UButton>

      <div v-else class="numeric-action">
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="soft"
          square
          :disabled="skipped || value <= 0"
          :aria-label="`Уменьшить ${habit.title} на ${step}`"
          @click="adjust(-1)"
        />
        <UInput
          v-model.number="directValue"
          type="number"
          min="0"
          :step="step"
          :disabled="skipped"
          :aria-label="`Текущее значение: ${habit.title}`"
          class="value-input"
          @blur="saveDirectValue"
          @keyup.enter="saveDirectValue"
        />
        <UButton
          icon="i-lucide-plus"
          color="primary"
          square
          :disabled="skipped"
          :loading="saving"
          :aria-label="`Увеличить ${habit.title} на ${step}`"
          @click="adjust(1)"
        />
      </div>
    </div>

    <div v-if="habit.trackingType !== 'BOOLEAN'" class="habit-progress" aria-hidden="true">
      <span :style="{ width: `${progress}%`, backgroundColor: habit.color || '#315c4c' }" />
    </div>

    <UTooltip text="Пропустить сегодня">
      <UButton
        class="skip-button"
        icon="i-lucide-forward"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="skipped || complete"
        :aria-label="`Пропустить сегодня: ${habit.title}`"
        @click="skipOpen = true"
      />
    </UTooltip>

    <UModal v-model:open="skipOpen" title="Пропустить сегодня" description="Пропуск не увеличивает и не прерывает серию.">
      <template #body>
        <div class="dialog-stack">
          <UFormField label="Причина" hint="Необязательно">
            <UTextarea v-model="skipNote" maxlength="500" autoresize placeholder="Например, день восстановления" autofocus />
          </UFormField>
          <div class="dialog-actions">
            <UButton color="neutral" variant="ghost" @click="skipOpen = false">Отмена</UButton>
            <UButton icon="i-lucide-forward" @click="submitSkip">Пропустить</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </article>
</template>
