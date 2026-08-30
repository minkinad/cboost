import { expect, test } from '@playwright/test'
import { createHabit, gotoHydrated, register, uniqueAccount } from './helpers'

test('Today remains usable at a mobile viewport', async ({ page }) => {
  await register(page, uniqueAccount('mobile'))
  await createHabit(page, { title: 'Mobile water', trackingType: 'QUANTITY', targetValue: 2, unit: 'л' })
  await gotoHydrated(page, '/')

  const mobileNavigation = page.getByRole('navigation', { name: 'Мобильная навигация' })
  await expect(mobileNavigation).toBeVisible()
  await expect(page.getByText('Mobile water', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Увеличить Mobile water на 0.1' }).click()
  await expect(page.getByText('0,1 / 2 л')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})
