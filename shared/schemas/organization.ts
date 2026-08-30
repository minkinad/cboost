import { z } from 'zod'
import { dateKeySchema } from './habits'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const colorSchema = z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Ожидается цвет #RRGGBB').nullable().optional()

export const categoryCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: optionalText(80),
  color: colorSchema
}).strict()

export const categoryUpdateInputSchema = categoryCreateInputSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  'Требуется хотя бы одно изменение'
)

export const goalStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED'])
export const goalHabitInputSchema = z.object({
  habitId: z.uuid(),
  weight: z.number().finite().positive().max(1000).default(1)
}).strict()

const goalFields = {
  title: z.string().trim().min(1).max(120),
  description: optionalText(2000),
  targetDate: dateKeySchema.nullable().optional(),
  status: goalStatusSchema,
  habits: z.array(goalHabitInputSchema).max(50)
} as const

function validateUniqueHabits(input: { habits?: Array<{ habitId: string }> }, context: z.RefinementCtx) {
  const ids = input.habits?.map((habit) => habit.habitId) ?? []
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: 'custom', path: ['habits'], message: 'Привычка не должна повторяться в цели' })
  }
}

export const goalCreateInputSchema = z.object({
  title: goalFields.title,
  description: goalFields.description,
  targetDate: goalFields.targetDate,
  status: goalFields.status.default('ACTIVE'),
  habits: goalFields.habits.default([])
}).strict().superRefine(validateUniqueHabits)

export const goalUpdateInputSchema = z.object({
  title: goalFields.title.optional(),
  description: goalFields.description,
  targetDate: goalFields.targetDate,
  status: goalFields.status.optional(),
  habits: goalFields.habits.optional()
}).strict().refine((input) => Object.keys(input).length > 0, 'Требуется хотя бы одно изменение').superRefine(validateUniqueHabits)

export const entityIdParamsSchema = z.object({ id: z.uuid() })

export type CategoryCreateInput = z.infer<typeof categoryCreateInputSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>
export type GoalCreateInput = z.infer<typeof goalCreateInputSchema>
export type GoalUpdateInput = z.infer<typeof goalUpdateInputSchema>
