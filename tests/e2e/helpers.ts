import { expect, type Page } from '@playwright/test'

let registrationSequence = 0

export interface TestAccount {
  email: string
  password: string
}

export function uniqueAccount(label: string): TestAccount {
  return {
    email: `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@dailyboost.test`,
    password: 'playwright-password-123'
  }
}

export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  await page.locator('html[data-nuxt-hydrated="true"]').waitFor()
}

export async function register(page: Page, account: TestAccount) {
  registrationSequence += 1
  const response = await page.request.post('/api/auth/register', {
    headers: { 'x-forwarded-for': `198.51.100.${registrationSequence}` },
    data: {
      ...account,
      displayName: 'Playwright User',
      timezone: 'UTC'
    }
  })
  expect(response.status()).toBe(201)
  const setCookie = response.headers()['set-cookie']
  const sessionValue = /nuxt-session=([^;]+)/.exec(setCookie ?? '')?.[1]
  expect(sessionValue).toBeTruthy()
  await page.context().addCookies([{
    name: 'nuxt-session',
    value: sessionValue!,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  }])
}

export async function createHabit(page: Page, input: {
  title: string
  trackingType?: 'BOOLEAN' | 'COUNT' | 'DURATION' | 'QUANTITY'
  targetValue?: number
  unit?: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  const trackingType = input.trackingType ?? 'BOOLEAN'
  const response = await page.request.post('/api/habits', {
    data: {
      title: input.title,
      description: `E2E ${input.title}`,
      trackingType,
      targetValue: trackingType === 'BOOLEAN' ? null : input.targetValue,
      unit: trackingType === 'BOOLEAN' ? null : input.unit,
      color: '#315c4c',
      icon: trackingType === 'QUANTITY' ? 'i-lucide-droplets' : 'i-lucide-circle-check-big',
      schedule: {
        type: 'EVERY_DAY',
        weekdays: [],
        timesPerWeek: null,
        intervalDays: null,
        startDate: today,
        endDate: null
      }
    }
  })
  expect(response.status()).toBe(201)
  return (await response.json()).habit as { id: string }
}
