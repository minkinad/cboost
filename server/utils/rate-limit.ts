import type { H3Event } from 'h3'

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
const maximumBuckets = 10_000

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < maximumBuckets) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  if (buckets.size >= maximumBuckets) buckets.delete(buckets.keys().next().value as string)
}

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  pruneExpiredBuckets(now)
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function assertRateLimit(event: H3Event, scope: string, limit: number, windowMs: number): void {
  const address = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const result = consumeRateLimit(`${scope}:${address}`, limit, windowMs)
  setResponseHeader(event, 'X-RateLimit-Limit', String(limit))
  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', result.retryAfterSeconds)
    throw createError({ statusCode: 429, statusMessage: 'Слишком много попыток. Повторите позже.' })
  }
}
