import { z } from 'zod'
import { timezoneSchema } from './auth'

export const reminderTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ожидается время HH:mm')

const reminderFieldsSchema = z.object({
  time: reminderTimeSchema,
  timezone: timezoneSchema,
  enabled: z.boolean()
}).strict()

export const reminderCreateInputSchema = reminderFieldsSchema.extend({ enabled: z.boolean().default(true) })

export const reminderUpdateInputSchema = reminderFieldsSchema.partial().refine(
  input => Object.keys(input).length > 0,
  'Требуется хотя бы одно изменение'
)

export const reminderIdParamsSchema = z.object({ id: z.uuid() })
export const reminderListQuerySchema = z.object({ habitId: z.uuid().optional() })

export type ReminderCreateInput = z.infer<typeof reminderCreateInputSchema>
export type ReminderUpdateInput = z.infer<typeof reminderUpdateInputSchema>
