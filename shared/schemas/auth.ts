import { z } from 'zod'

export function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export const emailSchema = z.email().trim().toLowerCase().max(320)
export const passwordSchema = z.string().min(12).max(128)
export const timezoneSchema = z.string().trim().min(1).max(100).refine(isIanaTimezone, 'Неизвестная timezone')

export const registerInputSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1).max(80).nullable().optional(),
    timezone: timezoneSchema.default('UTC')
  })
  .strict()

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128)
  })
  .strict()

export type RegisterInput = z.infer<typeof registerInputSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
