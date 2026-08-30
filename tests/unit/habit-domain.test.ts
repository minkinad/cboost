import { describe, expect, it } from 'vitest'
import {
  calculateBestHabitStreak,
  calculateDailyCompletion,
  calculateEntryStatus,
  calculateExpectedEntries,
  calculateHabitStreak,
  calculatePerfectDayStreak,
  canRecordEntryForDate,
  getEntryStatusForDate,
  isHabitScheduledForDate
} from '../../shared/domain/habits'
import type {
  HabitDto,
  HabitEntryDto,
  HabitEntryStatus,
  HabitScheduleDto,
  HabitScheduleType,
  TrackingType
} from '../../shared/types/habits'
import { getDateKeyInTimeZone } from '../../shared/utils/dates'

function entry(date: string, status: HabitEntryStatus, value: number | null = null): HabitEntryDto {
  return {
    id: `entry-${date}`,
    habitId: 'habit-1',
    date,
    value,
    status,
    note: null,
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`
  }
}

function schedule(type: HabitScheduleType, overrides: Partial<HabitScheduleDto> = {}): HabitScheduleDto {
  return {
    id: 'schedule-1',
    type,
    weekdays: [],
    timesPerWeek: null,
    intervalDays: null,
    startDate: '2026-08-01',
    endDate: null,
    ...overrides
  }
}

function habit(overrides: Partial<HabitDto> = {}): HabitDto {
  return {
    id: 'habit-1',
    title: 'Reading',
    description: null,
    trackingType: 'BOOLEAN',
    targetValue: null,
    unit: null,
    color: null,
    icon: null,
    categoryId: null,
    archivedAt: null,
    schedule: schedule('EVERY_DAY'),
    entries: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides
  }
}

describe('canonical schedule engine', () => {
  it('schedules EVERY_DAY inside its date range', () => {
    const target = habit({ schedule: schedule('EVERY_DAY', { startDate: '2026-08-27', endDate: '2026-08-29' }) })
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-26')).toBe(false)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-27')).toBe(true)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-29')).toBe(true)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-30')).toBe(false)
  })

  it('schedules Monday, Wednesday and Friday by calendar weekday', () => {
    const target = habit({ schedule: schedule('WEEKDAYS', { weekdays: [1, 3, 5] }) })
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-24')).toBe(true)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-25')).toBe(false)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-26')).toBe(true)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-28')).toBe(true)
  })

  it('keeps exactly three flexible weekly slots and reserves actual entry dates', () => {
    const target = habit({
      schedule: schedule('TIMES_PER_WEEK', { timesPerWeek: 3 }),
      entries: [entry('2026-08-25', 'COMPLETED'), entry('2026-08-27', 'PARTIAL', 10)]
    })
    const week = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30']
    const scheduled = week.filter((date) => isHabitScheduledForDate(target, target.schedule, date))
    expect(scheduled).toEqual(['2026-08-25', '2026-08-27', '2026-08-30'])
  })

  it('allows Today to reserve an earlier flexible weekly slot while quota remains', () => {
    const target = habit({ schedule: schedule('TIMES_PER_WEEK', { timesPerWeek: 3 }) })
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-24')).toBe(false)
    expect(canRecordEntryForDate(target, '2026-08-24')).toBe(true)
    expect(calculateDailyCompletion([target], '2026-08-24', '2026-08-24').expected).toBe(1)
  })

  it('schedules an interval from its start date', () => {
    const target = habit({ schedule: schedule('INTERVAL', { startDate: '2026-08-24', intervalDays: 2 }) })
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-24')).toBe(true)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-25')).toBe(false)
    expect(isHabitScheduledForDate(target, target.schedule, '2026-08-26')).toBe(true)
  })
})

describe('canonical entry status', () => {
  it('maps BOOLEAN false/true to PENDING/COMPLETED', () => {
    expect(calculateEntryStatus({ trackingType: 'BOOLEAN', targetValue: null, completed: false }).status).toBe('PENDING')
    expect(calculateEntryStatus({ trackingType: 'BOOLEAN', targetValue: null, completed: true }).status).toBe('COMPLETED')
  })

  it.each<[TrackingType, number, HabitEntryStatus]>([
    ['COUNT', 0, 'PENDING'],
    ['COUNT', 32, 'PARTIAL'],
    ['COUNT', 50, 'COMPLETED'],
    ['DURATION', 22, 'PARTIAL'],
    ['DURATION', 30, 'COMPLETED'],
    ['QUANTITY', 1.5, 'PARTIAL'],
    ['QUANTITY', 2, 'COMPLETED']
  ])('calculates %s value %s as %s', (trackingType, value, status) => {
    const targetValue = trackingType === 'QUANTITY' ? 2 : trackingType === 'COUNT' ? 50 : 30
    expect(calculateEntryStatus({ trackingType, targetValue, value }).status).toBe(status)
  })

  it('allows only explicit SKIPPED and derives MISSED for a past empty scheduled date', () => {
    expect(calculateEntryStatus({ trackingType: 'BOOLEAN', targetValue: null, explicitStatus: 'SKIPPED' }).status).toBe('SKIPPED')
    const target = habit()
    expect(getEntryStatusForDate(target, '2026-08-27', '2026-08-28')).toBe('MISSED')
    expect(getEntryStatusForDate(target, '2026-08-28', '2026-08-28')).toBe('PENDING')
  })
})

describe('timezone calendar model', () => {
  it('keeps the same instant on the correct IANA local calendar date', () => {
    const instant = new Date('2026-08-28T22:30:00.000Z')
    expect(getDateKeyInTimeZone(instant, 'Europe/Amsterdam')).toBe('2026-08-29')
    expect(getDateKeyInTimeZone(instant, 'Europe/Moscow')).toBe('2026-08-29')
    expect(getDateKeyInTimeZone(instant, 'America/New_York')).toBe('2026-08-28')
  })
})

describe('streak and consistency rules', () => {
  it('counts completed scheduled entries, keeps SKIPPED neutral and breaks on MISSED', () => {
    const target = habit({
      schedule: schedule('EVERY_DAY', { startDate: '2026-08-24' }),
      entries: [
        entry('2026-08-24', 'COMPLETED'),
        entry('2026-08-25', 'SKIPPED'),
        entry('2026-08-26', 'COMPLETED'),
        entry('2026-08-28', 'COMPLETED')
      ]
    })
    expect(calculateHabitStreak(target, '2026-08-28')).toBe(1)
    expect(calculateBestHabitStreak(target, '2026-08-28')).toBe(2)
  })

  it('calculates daily completed/expected consistency', () => {
    const first = habit({ id: 'habit-1', entries: [entry('2026-08-27', 'COMPLETED')] })
    const second = habit({ id: 'habit-2', entries: [{ ...entry('2026-08-27', 'PARTIAL', 5), habitId: 'habit-2' }] })
    const day = calculateDailyCompletion([first, second], '2026-08-27', '2026-08-28')
    expect(day).toMatchObject({ scheduled: 2, expected: 2, completed: 1, rate: 50, perfect: false })
    expect(calculateExpectedEntries([first, second], ['2026-08-27'], '2026-08-28')).toHaveLength(2)
  })

  it('counts perfect days and treats an explicit skip as a neutral obligation', () => {
    const first = habit({
      id: 'habit-1',
      schedule: schedule('EVERY_DAY', { startDate: '2026-08-26' }),
      entries: [entry('2026-08-26', 'COMPLETED'), entry('2026-08-27', 'COMPLETED')]
    })
    const second = habit({
      id: 'habit-2',
      schedule: { ...schedule('EVERY_DAY', { startDate: '2026-08-26' }), id: 'schedule-2' },
      entries: [
        { ...entry('2026-08-26', 'COMPLETED'), habitId: 'habit-2' },
        { ...entry('2026-08-27', 'SKIPPED'), habitId: 'habit-2' }
      ]
    })
    expect(calculateDailyCompletion([first, second], '2026-08-27', '2026-08-28')).toMatchObject({ expected: 1, completed: 1, perfect: true })
    expect(calculatePerfectDayStreak([first, second], '2026-08-28')).toBe(2)
  })
})
