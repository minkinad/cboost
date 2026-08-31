import { expect, test } from '@playwright/test'
import { createHabit, gotoHydrated, register, uniqueAccount } from './helpers'

test.beforeEach(async ({ page }) => {
  await register(page, uniqueAccount('offline'))
})

test('manifest is installable and notification permission remains user initiated', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { __notificationPermissionRequests?: number }
    state.__notificationPermissionRequests = 0
    Object.defineProperty(Notification, 'requestPermission', {
      configurable: true,
      value: async () => {
        state.__notificationPermissionRequests = (state.__notificationPermissionRequests ?? 0) + 1
        return 'denied'
      }
    })
  })
  const manifestResponse = await page.request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({ name: 'DailyBoost', display: 'standalone', start_url: '/' })
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192' }),
    expect.objectContaining({ sizes: '512x512' }),
    expect.objectContaining({ purpose: 'maskable' })
  ]))

  const habit = await createHabit(page, { title: 'Permission control' })
  await gotoHydrated(page, `/habits/${habit.id}`)
  await expect(page.getByRole('button', { name: 'Разрешить уведомления' })).toBeVisible()
  expect(await page.evaluate(() => (window as typeof window & { __notificationPermissionRequests?: number }).__notificationPermissionRequests)).toBe(0)
})

test('queues a habit entry offline and replays it idempotently after reconnect', async ({ page }) => {
  const habit = await createHabit(page, { title: 'Offline exercise' })
  await gotoHydrated(page, '/')

  await page.route('**/api/habits/*/entries/*', route => route.abort('internetdisconnected'))
  await page.getByRole('button', { name: 'Выполнить: Offline exercise' }).click()
  await expect.poll(() => page.evaluate(async () => {
    return await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open('dailyboost-sync', 1)
      request.onsuccess = () => {
        const count = request.result.transaction('mutations').objectStore('mutations').count()
        count.onsuccess = () => resolve(count.result)
        count.onerror = () => reject(count.error)
      }
      request.onerror = () => reject(request.error)
    })
  })).toBe(1)
  await expect(page.locator('.sync-indicator:visible')).toContainText('Saved offline')
  await expect(page.getByText('Выполнено', { exact: true })).toBeVisible()

  const beforeReplay = await page.request.get(`/api/habits/${habit.id}`)
  const beforeReplayBody = await beforeReplay.json()
  expect(beforeReplayBody.habit.entries).toHaveLength(0)

  await page.unroute('**/api/habits/*/entries/*')
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.locator('.sync-indicator:visible')).toContainText('Synced', { timeout: 15_000 })

  const response = await page.request.get(`/api/habits/${habit.id}`)
  expect(response.ok()).toBe(true)
  const body = await response.json()
  expect(body.habit.entries.some((entry: { status: string }) => entry.status === 'COMPLETED')).toBe(true)
})
