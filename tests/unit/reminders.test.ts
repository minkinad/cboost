import { describe, expect, it } from 'vitest'
import { reminderCreateInputSchema, reminderUpdateInputSchema } from '../../shared/schemas/reminders'

describe('reminder validation', () => {
  it('accepts an IANA timezone and strict 24-hour time', () => {
    expect(reminderCreateInputSchema.parse({ time: '07:05', timezone: 'Europe/Moscow' })).toEqual({
      time: '07:05',
      timezone: 'Europe/Moscow',
      enabled: true
    })
  })

  it('rejects invalid times, timezones, and empty updates', () => {
    expect(reminderCreateInputSchema.safeParse({ time: '24:00', timezone: 'UTC' }).success).toBe(false)
    expect(reminderCreateInputSchema.safeParse({ time: '08:00', timezone: 'Mars/Olympus' }).success).toBe(false)
    expect(reminderUpdateInputSchema.safeParse({}).success).toBe(false)
  })
})
