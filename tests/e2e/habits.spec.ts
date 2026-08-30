import { expect, test } from '@playwright/test'
import { gotoHydrated, register, uniqueAccount } from './helpers'

test('create, edit, reschedule, archive and restore a habit', async ({ page }) => {
  await register(page, uniqueAccount('manage'))
  await gotoHydrated(page, '/habits/new')

  await page.getByLabel('Название').fill('Reading')
  await page.getByLabel('Тип учёта').click()
  await page.getByRole('option', { name: 'Длительность' }).click()
  await page.getByLabel('Цель по времени').fill('30')
  await page.getByLabel('Единица').fill('мин')
  await page.getByRole('button', { name: 'Создать привычку' }).click()

  await expect(page).toHaveURL(/\/habits\/[\w-]+$/)
  await expect(page.getByRole('heading', { name: 'Reading' })).toBeVisible()

  await page.getByRole('button', { name: 'Изменить' }).click()
  await page.getByLabel('Название').fill('Deep reading')
  await page.getByLabel('Цель', { exact: true }).fill('45')
  await page.getByLabel('Расписание').click()
  await page.getByRole('option', { name: 'По дням недели' }).click()
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect(page.getByRole('heading', { name: 'Deep reading' })).toBeVisible()
  await expect(page.getByText('45 мин', { exact: true })).toBeVisible()
  await expect(page.getByText('Пн, Ср, Пт', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'В архив' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'В архив' }).click()
  await expect(page).toHaveURL('/habits')
  await expect(page.getByText('Deep reading', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Восстановить Deep reading' }).click()
  await expect(page.getByText('Привычка восстановлена', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Архивировать Deep reading' })).toBeVisible()
})
