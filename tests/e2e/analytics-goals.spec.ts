import { expect, test } from '@playwright/test'
import { gotoHydrated, register, uniqueAccount } from './helpers'

test('creates a category and a weighted goal, then opens deterministic analytics', async ({ page }) => {
  await register(page, uniqueAccount('analytics'))
  await gotoHydrated(page, '/settings')

  await page.getByLabel('Название').fill('Study')
  await page.getByRole('button', { name: 'Добавить' }).click()
  await expect(page.getByText('Study', { exact: true })).toBeVisible()

  await gotoHydrated(page, '/habits/new')
  await page.getByLabel('Название').fill('Vocabulary')
  await page.getByLabel('Категория').click()
  await page.getByRole('option', { name: 'Study' }).click()
  await page.getByRole('button', { name: 'Создать привычку' }).click()
  await expect(page.getByRole('heading', { name: 'Vocabulary' })).toBeVisible()

  await gotoHydrated(page, '/goals')
  await page.getByRole('button', { name: 'Новая цель' }).click()
  await page.getByRole('dialog').getByLabel('Название').fill('English B2')
  await page.getByRole('dialog').getByRole('checkbox').check()
  await page.getByRole('dialog').getByLabel('Вес').fill('2')
  await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click()
  await expect(page.getByRole('heading', { name: 'English B2' })).toBeVisible()
  await expect(page.getByText('Последние 30 scheduled days')).toBeVisible()

  await gotoHydrated(page, '/progress')
  await expect(page.getByRole('heading', { name: 'Прогресс' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Последние 90 дней' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ваша неделя' })).toBeVisible()
})
