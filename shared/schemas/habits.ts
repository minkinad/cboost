import { z } from 'zod'
import { isDateKey } from '../utils/dates'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

export const trackingTypeSchema = z.enum(['BOOLEAN', 'COUNT', 'DURATION', 'QUANTITY'])
export const habitScheduleTypeSchema = z.enum(['EVERY_DAY', 'WEEKDAYS', 'TIMES_PER_WEEK', 'INTERVAL'])
export const habitEntryStatusSchema = z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'SKIPPED', 'MISSED'])

export const dateKeySchema = z
  .string()
  .refine(isDateKey, 'Ожидается существующая календарная дата в формате YYYY-MM-DD')

export const habitScheduleInputSchema = z
  .object({
    type: habitScheduleTypeSchema,
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    timesPerWeek: z.number().int().min(1).max(7).nullable().optional(),
    intervalDays: z.number().int().min(1).max(365).nullable().optional(),
    startDate: dateKeySchema,
    endDate: dateKeySchema.nullable().optional()
  })
  .strict()
  .superRefine((schedule, context) => {
    if (new Set(schedule.weekdays).size !== schedule.weekdays.length) {
      context.addIssue({ code: 'custom', path: ['weekdays'], message: 'Дни недели не должны повторяться' })
    }

    if (schedule.endDate && schedule.endDate < schedule.startDate) {
      context.addIssue({ code: 'custom', path: ['endDate'], message: 'Дата окончания раньше даты начала' })
    }

    if (schedule.type === 'EVERY_DAY' && schedule.weekdays.length > 0) {
      context.addIssue({ code: 'custom', path: ['weekdays'], message: 'EVERY_DAY не использует weekdays' })
    }

    if (schedule.type === 'EVERY_DAY' && (schedule.timesPerWeek != null || schedule.intervalDays != null)) {
      context.addIssue({ code: 'custom', message: 'EVERY_DAY не использует timesPerWeek или intervalDays' })
    }

    if (schedule.type === 'WEEKDAYS' && schedule.weekdays.length === 0) {
      context.addIssue({ code: 'custom', path: ['weekdays'], message: 'WEEKDAYS требует хотя бы один день' })
    }

    if (schedule.type === 'WEEKDAYS' && (schedule.timesPerWeek != null || schedule.intervalDays != null)) {
      context.addIssue({ code: 'custom', message: 'WEEKDAYS использует только weekdays' })
    }

    if (schedule.type === 'TIMES_PER_WEEK' && !schedule.timesPerWeek) {
      context.addIssue({ code: 'custom', path: ['timesPerWeek'], message: 'TIMES_PER_WEEK требует timesPerWeek' })
    }

    if (schedule.type === 'TIMES_PER_WEEK' && (schedule.weekdays.length > 0 || schedule.intervalDays != null)) {
      context.addIssue({ code: 'custom', message: 'TIMES_PER_WEEK не использует weekdays или intervalDays' })
    }

    if (schedule.type === 'INTERVAL' && !schedule.intervalDays) {
      context.addIssue({ code: 'custom', path: ['intervalDays'], message: 'INTERVAL требует intervalDays' })
    }

    if (schedule.type === 'INTERVAL' && (schedule.weekdays.length > 0 || schedule.timesPerWeek != null)) {
      context.addIssue({ code: 'custom', message: 'INTERVAL не использует weekdays или timesPerWeek' })
    }
  })

const habitFields = {
  title: z.string().trim().min(1).max(80),
  description: optionalText(2000),
  trackingType: trackingTypeSchema,
  targetValue: z.number().finite().positive().max(999_999_999).nullable().optional(),
  unit: optionalText(20),
  color: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Ожидается цвет #RRGGBB').nullable().optional(),
  icon: optionalText(80),
  categoryId: z.uuid().nullable().optional()
} as const

function validateTrackingTarget(
  value: { trackingType: z.infer<typeof trackingTypeSchema>; targetValue?: number | null; unit?: string | null },
  context: z.RefinementCtx
) {
  if (value.trackingType === 'BOOLEAN') {
    if (value.targetValue != null) {
      context.addIssue({ code: 'custom', path: ['targetValue'], message: 'BOOLEAN не использует targetValue' })
    }
    return
  }

  if (value.targetValue == null || value.targetValue <= 0) {
    context.addIssue({ code: 'custom', path: ['targetValue'], message: 'Для числовой привычки targetValue > 0' })
  }

  if (!value.unit?.trim()) {
    context.addIssue({ code: 'custom', path: ['unit'], message: 'Для числовой привычки требуется unit' })
  }
}

export const habitCreateInputSchema = z
  .object({
    ...habitFields,
    schedule: habitScheduleInputSchema
  })
  .strict()
  .superRefine(validateTrackingTarget)

export const habitUpdateInputSchema = z
  .object({
    title: habitFields.title.optional(),
    description: habitFields.description,
    trackingType: habitFields.trackingType.optional(),
    targetValue: habitFields.targetValue,
    unit: habitFields.unit,
    color: habitFields.color,
    icon: habitFields.icon,
    categoryId: habitFields.categoryId,
    schedule: habitScheduleInputSchema.optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Требуется хотя бы одно изменение')

export const habitEntryPutInputSchema = z
  .object({
    value: z.number().finite().min(0).max(999_999_999).nullable().optional(),
    completed: z.boolean().optional(),
    status: z.literal('SKIPPED').optional(),
    note: optionalText(500)
  })
  .strict()
  .superRefine((input, context) => {
    if (input.status === 'SKIPPED' && (input.value != null || input.completed != null)) {
      context.addIssue({ code: 'custom', message: 'SKIPPED не совмещается с value или completed' })
    }
  })

export const habitIdParamsSchema = z.object({
  id: z.uuid()
})

export const habitEntryParamsSchema = z.object({
  id: z.uuid(),
  date: dateKeySchema
})

export const legacyHabitSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(2000).optional().default(''),
    frequency: z.enum(['daily', 'weekly']),
    target: z.number().finite().positive().max(999_999_999),
    unit: z.string().trim().min(1).max(20),
    color: z.string().trim().regex(/^#[0-9a-f]{6}$/i),
    createdAt: z.iso.datetime(),
    completions: z.array(dateKeySchema).max(20_000)
  })
  .strict()

export const legacyImportInputSchema = z
  .object({
    habits: z.array(legacyHabitSchema).max(1000)
  })
  .strict()

export type HabitCreateInput = z.infer<typeof habitCreateInputSchema>
export type HabitUpdateInput = z.infer<typeof habitUpdateInputSchema>
export type HabitEntryPutInput = z.infer<typeof habitEntryPutInputSchema>
export type HabitScheduleInput = z.infer<typeof habitScheduleInputSchema>
export type LegacyImportInput = z.infer<typeof legacyImportInputSchema>
