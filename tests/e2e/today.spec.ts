import { expect, test } from '@playwright/test'
import { createHabit, gotoHydrated, register, uniqueAccount } from './helpers'

test.beforeEach(async ({ page }) => {
  await register(page, uniqueAccount('today'))
})

test('Today loads and completes a boolean habit in one click', async ({ page }) => {
  await createHabit(page, { title: 'Morning exercise' })
  await gotoHydrated(page, '/')

  await expect(page.getByRole('heading', { name: 'Сегодня', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Выполнить: Morning exercise' }).click()
  await expect(page.getByText('Выполнено', { exact: true })).toBeVisible()
  await expect(page.getByText('1 из 1 выполнено')).toBeVisible()
})

test('quantity progress moves through partial and completed states', async ({ page }) => {
  await createHabit(page, { title: 'Water', trackingType: 'QUANTITY', targetValue: 2, unit: 'л' })
  await gotoHydrated(page, '/')

  await page.getByRole('button', { name: 'Увеличить Water на 0.1' }).click()
  await expect(page.getByText('0,1 / 2 л')).toBeVisible()
  await expect(page.getByText('0 из 1 выполнено')).toBeVisible()

  const value = page.getByLabel('Текущее значение: Water')
  await value.fill('2')
  await value.press('Enter')
  await expect(page.getByText('1 из 1 выполнено')).toBeVisible()
})
