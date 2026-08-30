import type { HabitDto, HabitEntryDto, HabitScheduleDto, TrackingType } from '~~/shared/types/habits'

const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const trackingLabels: Record<TrackingType, string> = {
  BOOLEAN: 'Да / нет',
  COUNT: 'Количество',
  DURATION: 'Длительность',
  QUANTITY: 'Объём'
}

export function formatSchedule(schedule: HabitScheduleDto): string {
  if (schedule.type === 'EVERY_DAY') return 'Каждый день'
  if (schedule.type === 'WEEKDAYS') return schedule.weekdays.map((day) => weekdayNames[day]).join(', ')
  if (schedule.type === 'TIMES_PER_WEEK') return `${schedule.timesPerWeek} раза в неделю`
  return `Каждые ${schedule.intervalDays} дня`
}

export function entryForDate(habit: HabitDto, date: string): HabitEntryDto | undefined {
  return (habit.entries ?? []).find((entry) => entry.date === date)
}

export function quickStep(trackingType: TrackingType): number {
  if (trackingType === 'DURATION') return 5
  if (trackingType === 'QUANTITY') return 0.1
  return 1
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value ?? 0)
}

export function progressLabel(habit: HabitDto, date: string): string {
  const entry = entryForDate(habit, date)
  if (habit.trackingType === 'BOOLEAN') return entry?.status === 'COMPLETED' ? 'Выполнено' : 'Не выполнено'
  return `${formatNumber(entry?.value)} / ${formatNumber(habit.targetValue)} ${habit.unit ?? ''}`.trim()
}

export function formatLongDate(date: string, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(`${date}T12:00:00.000Z`))
}
