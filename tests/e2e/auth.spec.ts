import { expect, test } from '@playwright/test'
import { gotoHydrated, register, uniqueAccount } from './helpers'

test('login opens Today without replacing the application shell', async ({ page }) => {
  const account = uniqueAccount('login')
  await register(page, account)
  await page.request.post('/api/auth/logout')

  await gotoHydrated(page, '/login')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Пароль').fill(account.password)
  await page.getByRole('button', { name: 'Войти' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Сегодня', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible()
})
