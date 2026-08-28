import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetch as nuxtFetch, setup } from '@nuxt/test-utils/e2e'
import type { HabitEntryResponse, HabitResponse, LegacyImportResponse } from '../../shared/contracts/habits'
import { disconnectPrisma, usePrisma } from '../../server/utils/prisma'

const databaseUrl = 'postgresql://dailyboost:dailyboost@localhost:5432/dailyboost?schema=public'
const sessionPassword = 'dailyboost-integration-session-secret-at-least-thirty-two-characters'

await setup({
  rootDir: process.cwd(),
  browser: false,
  server: true,
  build: true,
  dev: false,
  setupTimeout: 180_000,
  env: {
    DATABASE_URL: databaseUrl,
    NUXT_SESSION_PASSWORD: sessionPassword
  }
})

function cookieFrom(response: Response): string {
  const header = response.headers.get('set-cookie')
  expect(header).toBeTruthy()
  return header!.split(';')[0]!
}

async function request(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {}
): Promise<Response> {
  return nuxtFetch(path, {
    method: options.method,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: 'manual'
  })
}

async function cleanup() {
  await usePrisma().user.deleteMany({ where: { email: { endsWith: '@dailyboost.test' } } })
}

beforeAll(cleanup)
afterAll(async () => {
  await cleanup()
  await disconnectPrisma()
})

describe('authenticated habits API', () => {
  it('covers auth, ownership, entry upsert, validation and idempotent legacy import', async () => {
    const unauthenticated = await request('/api/habits')
    expect(unauthenticated.status).toBe(401)

    const registration = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'owner@dailyboost.test',
        password: 'owner-password-123',
        displayName: 'Owner',
        timezone: 'Europe/Moscow'
      }
    })
    expect(registration.status).toBe(201)
    const ownerCookie = cookieFrom(registration)

    const currentSession = await request('/api/auth/session', { cookie: ownerCookie })
    expect(currentSession.status).toBe(200)
    expect((await currentSession.json()).user.email).toBe('owner@dailyboost.test')

    const duplicateRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'OWNER@dailyboost.test',
        password: 'owner-password-123',
        timezone: 'Europe/Moscow'
      }
    })
    expect(duplicateRegistration.status).toBe(409)

    const invalidTarget = await request('/api/habits', {
      method: 'POST',
      cookie: ownerCookie,
      body: {
        title: 'Некорректная цель',
        trackingType: 'COUNT',
        unit: 'раз',
        schedule: { type: 'DAILY', weekdays: [], startDate: '2026-08-01' }
      }
    })
    expect(invalidTarget.status).toBe(400)

    const created = await request('/api/habits', {
      method: 'POST',
      cookie: ownerCookie,
      body: {
        title: 'Отжимания',
        trackingType: 'COUNT',
        targetValue: 10,
        unit: 'раз',
        color: '#ff5c3d',
        schedule: { type: 'DAILY', weekdays: [], startDate: '2026-08-01' }
      }
    })
    expect(created.status).toBe(201)
    const habit = (await created.json() as HabitResponse).habit

    const ownHabit = await request(`/api/habits/${habit.id}`, { cookie: ownerCookie })
    expect(ownHabit.status).toBe(200)
    expect(((await ownHabit.json()) as HabitResponse).habit.id).toBe(habit.id)

    const updated = await request(`/api/habits/${habit.id}`, {
      method: 'PATCH',
      cookie: ownerCookie,
      body: { title: 'Отжимания утром' }
    })
    expect(updated.status).toBe(200)
    expect(((await updated.json()) as HabitResponse).habit.title).toBe('Отжимания утром')

    const secondRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'other@dailyboost.test',
        password: 'other-password-123',
        timezone: 'UTC'
      }
    })
    expect(secondRegistration.status).toBe(201)
    const otherCookie = cookieFrom(secondRegistration)

    expect((await request(`/api/habits/${habit.id}`, { cookie: otherCookie })).status).toBe(404)
    expect((await request(`/api/habits/${habit.id}`, { method: 'PATCH', cookie: otherCookie, body: { title: 'IDOR' } })).status).toBe(404)
    expect((await request(`/api/habits/${habit.id}`, { method: 'DELETE', cookie: otherCookie })).status).toBe(404)
    expect((await request(`/api/habits/${habit.id}/entries/2026-08-28`, { method: 'PUT', cookie: otherCookie, body: { value: 10 } })).status).toBe(404)

    const firstEntry = await request(`/api/habits/${habit.id}/entries/2026-08-28`, {
      method: 'PUT',
      cookie: ownerCookie,
      body: { value: 5 }
    })
    expect(firstEntry.status).toBe(200)
    expect(((await firstEntry.json()) as HabitEntryResponse).entry.status).toBe('PARTIAL')

    const secondEntry = await request(`/api/habits/${habit.id}/entries/2026-08-28`, {
      method: 'PUT',
      cookie: ownerCookie,
      body: { value: 10 }
    })
    expect(secondEntry.status).toBe(200)
    const updatedEntry = ((await secondEntry.json()) as HabitEntryResponse).entry
    expect(updatedEntry.status).toBe('COMPLETED')

    const entries = await request(`/api/habits/${habit.id}/entries`, { cookie: ownerCookie })
    const entriesBody = await entries.json()
    expect(entriesBody.entries).toHaveLength(1)
    expect(entriesBody.entries[0].id).toBe(updatedEntry.id)

    const legacyBody = {
      habits: [{
        id: 'legacy-habit-1',
        title: 'Legacy reading',
        description: '',
        frequency: 'daily',
        target: 1,
        unit: 'раз',
        color: '#0f7173',
        createdAt: '2026-08-01T10:00:00.000Z',
        completions: ['2026-08-25', '2026-08-25', '2026-08-26']
      }]
    }
    const firstImport = await request('/api/legacy/import', { method: 'POST', cookie: ownerCookie, body: legacyBody })
    expect(firstImport.status).toBe(200)
    expect((await firstImport.json()) as LegacyImportResponse).toEqual({ importedHabits: 1, importedEntries: 2, skippedHabits: 0 })

    const repeatedImport = await request('/api/legacy/import', { method: 'POST', cookie: ownerCookie, body: legacyBody })
    expect(repeatedImport.status).toBe(200)
    expect((await repeatedImport.json()) as LegacyImportResponse).toEqual({ importedHabits: 0, importedEntries: 0, skippedHabits: 1 })

    const logout = await request('/api/auth/logout', { method: 'POST', cookie: ownerCookie })
    expect(logout.status).toBe(204)
    expect(logout.headers.get('set-cookie')).toContain('nuxt-session=;')

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'owner@dailyboost.test', password: 'owner-password-123' }
    })
    expect(login.status).toBe(200)
    expect(cookieFrom(login)).toContain('nuxt-session=')
  })
})
