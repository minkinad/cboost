import { describe, expect, it } from 'vitest'
import { coalesceEntryMutations, entryMutationId, type PendingEntryMutation } from '../../app/features/sync/model/offline-queue'
import { consumeRateLimit } from '../../server/utils/rate-limit'

function mutation(habitId: string, date: string, value: number, createdAt: string): PendingEntryMutation {
  return {
    id: entryMutationId(habitId, date),
    kind: 'PUT_HABIT_ENTRY',
    habitId,
    date,
    input: { value },
    createdAt,
    attempts: 0,
    lastError: null
  }
}

describe('offline entry queue', () => {
  it('uses the server idempotency key and keeps only the latest value per habit day', () => {
    const first = mutation('habit-a', '2026-08-30', 1, '2026-08-30T08:00:00.000Z')
    const latest = mutation('habit-a', '2026-08-30', 2, '2026-08-30T08:01:00.000Z')
    const other = mutation('habit-b', '2026-08-30', 3, '2026-08-30T07:00:00.000Z')

    expect(entryMutationId('habit-a', '2026-08-30')).toBe('entry:habit-a:2026-08-30')
    expect(coalesceEntryMutations([first, other, latest])).toEqual([other, latest])
  })
})

describe('authentication rate limiter', () => {
  it('rejects excess attempts with a deterministic retry delay and resets the window', () => {
    const key = 'unit-login-2026-08-31'
    expect(consumeRateLimit(key, 2, 10_000, 1_000).allowed).toBe(true)
    expect(consumeRateLimit(key, 2, 10_000, 2_000).allowed).toBe(true)
    expect(consumeRateLimit(key, 2, 10_000, 3_000)).toEqual({ allowed: false, retryAfterSeconds: 8 })
    expect(consumeRateLimit(key, 2, 10_000, 11_000).allowed).toBe(true)
  })
})
