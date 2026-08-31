import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, devices, type APIResponse, type BrowserContext, type Page } from '@playwright/test'

const baseURL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3000'
const outputDirectory = resolve('docs/screenshots')
const timezone = 'Europe/Moscow'
const password = 'dailyboost-screenshot-password'
const email = `showcase-${Date.now()}@dailyboost.test`

const screenshotHost = new URL(baseURL).hostname
if (!['127.0.0.1', 'localhost', '::1'].includes(screenshotHost) && process.env.ALLOW_REMOTE_SCREENSHOT_SEED !== '1') {
  throw new Error('Screenshot seeding is limited to a local server. Set ALLOW_REMOTE_SCREENSHOT_SEED=1 to override deliberately.')
}

interface HabitRecord {
  id: string
  title: string
}

async function expectOk(response: APIResponse, operation: string) {
  if (response.ok()) {
    return
  }

  throw new Error(`${operation} failed (${response.status()}): ${await response.text()}`)
}

function dateKeyInTimezone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function register(context: BrowserContext) {
  const response = await context.request.post('/api/auth/register', {
    headers: { 'x-forwarded-for': '198.51.100.240' },
    data: {
      email,
      password,
      displayName: 'Алексей',
      timezone
    }
  })
  await expectOk(response, 'Registration')

  const sessionValue = /nuxt-session=([^;]+)/.exec(response.headers()['set-cookie'] ?? '')?.[1]
  if (!sessionValue) {
    throw new Error('Registration response did not contain a session cookie')
  }

  await context.addCookies([{
    name: 'nuxt-session',
    value: sessionValue,
    url: baseURL,
    httpOnly: true,
    sameSite: 'Lax'
  }])
}

async function createCategory(context: BrowserContext) {
  const response = await context.request.post('/api/categories', {
    data: { name: 'Развитие', icon: 'i-lucide-sprout', color: '#315c4c' }
  })
  await expectOk(response, 'Category creation')
  return (await response.json()).category.id as string
}

async function createHabit(
  context: BrowserContext,
  input: {
    title: string
    description: string
    trackingType: 'BOOLEAN' | 'COUNT' | 'DURATION' | 'QUANTITY'
    targetValue: number | null
    unit: string | null
    color: string
    icon: string
  },
  categoryId: string,
  startDate: string
) {
  const response = await context.request.post('/api/habits', {
    data: {
      ...input,
      categoryId,
      schedule: {
        type: 'EVERY_DAY',
        weekdays: [],
        timesPerWeek: null,
        intervalDays: null,
        startDate,
        endDate: null
      }
    }
  })
  await expectOk(response, `Habit creation: ${input.title}`)
  return (await response.json()).habit as HabitRecord
}

async function putEntry(context: BrowserContext, habitId: string, date: string, data: Record<string, unknown>) {
  const response = await context.request.put(`/api/habits/${habitId}/entries/${date}`, { data })
  await expectOk(response, `Entry creation: ${habitId} on ${date}`)
}

async function seedShowcase(context: BrowserContext) {
  const today = dateKeyInTimezone(new Date())
  const startDate = shiftDateKey(today, -89)
  const categoryId = await createCategory(context)
  const habitInputs = [
    {
      title: 'Утренняя зарядка',
      description: 'Начать день с движения',
      trackingType: 'BOOLEAN' as const,
      targetValue: null,
      unit: null,
      color: '#d97952',
      icon: 'i-lucide-dumbbell'
    },
    {
      title: 'Чтение',
      description: 'Книги без уведомлений',
      trackingType: 'DURATION' as const,
      targetValue: 30,
      unit: 'мин',
      color: '#315c4c',
      icon: 'i-lucide-book-open'
    },
    {
      title: 'Вода',
      description: 'Поддерживать водный баланс',
      trackingType: 'QUANTITY' as const,
      targetValue: 2,
      unit: 'л',
      color: '#4a84a8',
      icon: 'i-lucide-droplets'
    },
    {
      title: 'Новые слова',
      description: 'Расширять английский словарь',
      trackingType: 'COUNT' as const,
      targetValue: 20,
      unit: 'слов',
      color: '#8b6aa8',
      icon: 'i-lucide-languages'
    }
  ]
  const habits = await Promise.all(habitInputs.map(input => createHabit(context, input, categoryId, startDate)))
  const [exercise, reading, water, vocabulary] = habits

  for (let offset = -89; offset <= 0; offset += 1) {
    const date = shiftDateKey(today, offset)
    const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay()
    const entries: Array<Promise<void>> = []

    if (offset === 0) {
      entries.push(
        putEntry(context, exercise.id, date, { completed: true }),
        putEntry(context, reading.id, date, { value: 22 }),
        putEntry(context, water.id, date, { value: 1.5 }),
        putEntry(context, vocabulary.id, date, { value: 12 })
      )
    } else {
      if (weekday !== 5 || Math.abs(offset) % 3 === 0) {
        entries.push(putEntry(context, exercise.id, date, { completed: true }))
      }
      if (Math.abs(offset) % 11 !== 0) {
        entries.push(putEntry(context, reading.id, date, { value: Math.abs(offset) % 7 === 0 ? 18 : 35 }))
      }
      if (Math.abs(offset) % 8 !== 0) {
        entries.push(putEntry(context, water.id, date, { value: Math.abs(offset) % 5 === 0 ? 1.4 : 2.1 }))
      }
      if (Math.abs(offset) % 10 === 0) {
        entries.push(putEntry(context, vocabulary.id, date, { status: 'SKIPPED', note: 'День восстановления' }))
      } else if (Math.abs(offset) % 9 !== 0) {
        entries.push(putEntry(context, vocabulary.id, date, { value: Math.abs(offset) % 6 === 0 ? 14 : 24 }))
      }
    }

    await Promise.all(entries)
  }

  const goalResponse = await context.request.post('/api/goals', {
    data: {
      title: 'English B2',
      description: 'Уверенно читать и общаться на английском',
      targetDate: shiftDateKey(today, 120),
      status: 'ACTIVE',
      habits: [
        { habitId: reading.id, weight: 1 },
        { habitId: vocabulary.id, weight: 2 }
      ]
    }
  })
  await expectOk(goalResponse, 'Goal creation')
  return { habits, today }
}

async function prepareAnalyticsShowcase(context: BrowserContext, habits: HabitRecord[], today: string) {
  const [exercise, reading, water, vocabulary] = habits
  const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay()
  const daysSinceMonday = (weekday + 6) % 7

  for (let offset = -daysSinceMonday - 7; offset <= -daysSinceMonday - 1; offset += 1) {
    const date = shiftDateKey(today, offset)
    await Promise.all([
      putEntry(context, exercise.id, date, { completed: true }),
      putEntry(context, reading.id, date, { value: 32 }),
      putEntry(context, water.id, date, { value: 1.2 }),
      putEntry(context, vocabulary.id, date, { status: 'SKIPPED', note: 'Плановый перерыв' })
    ])
  }

  for (let offset = -daysSinceMonday; offset <= 0; offset += 1) {
    const date = shiftDateKey(today, offset)
    await Promise.all([
      putEntry(context, exercise.id, date, { completed: true }),
      putEntry(context, reading.id, date, { value: 35 }),
      putEntry(context, water.id, date, { value: offset === 0 ? 1.5 : 2.1 }),
      putEntry(context, vocabulary.id, date, { value: 24 })
    ])
  }
}

async function preparePage(page: Page, path: string, heading: string) {
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.locator('html[data-nuxt-hydrated="true"]').waitFor()
  await page.getByRole('heading', { name: heading, exact: true }).waitFor()
  await page.addStyleTag({ content: '.pwa-lifecycle { display: none !important; }' })
  await page.evaluate(() => document.fonts.ready)
}

async function main() {
  await mkdir(outputDirectory, { recursive: true })
  const browser = await chromium.launch()
  const desktop = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1
  })

  try {
    await register(desktop)
    const showcase = await seedShowcase(desktop)
    const page = await desktop.newPage()

    await preparePage(page, '/', 'Сегодня')
    await page.screenshot({ path: resolve(outputDirectory, 'today.png') })

    const mobile = await browser.newContext({
      ...devices['iPhone 13'],
      baseURL,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      storageState: await desktop.storageState()
    })
    const mobilePage = await mobile.newPage()
    await preparePage(mobilePage, '/', 'Сегодня')
    await mobilePage.screenshot({ path: resolve(outputDirectory, 'today-mobile.png') })
    await mobile.close()

    await prepareAnalyticsShowcase(desktop, showcase.habits, showcase.today)

    await preparePage(page, '/progress', 'Прогресс')
    await page.getByRole('heading', { name: 'Последние 90 дней' }).waitFor()
    await page.screenshot({ path: resolve(outputDirectory, 'progress.png') })

    await preparePage(page, '/goals', 'Цели')
    await page.getByText('English B2', { exact: true }).waitFor()
    await page.screenshot({ path: resolve(outputDirectory, 'goals.png') })
  } finally {
    await desktop.close()
    await browser.close()
  }
}

await main()
