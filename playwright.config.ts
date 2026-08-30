import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chromium',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['iPhone 13'], browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'npm run build && node .output/server/index.mjs',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: 'postgresql://dailyboost:dailyboost@localhost:5432/dailyboost?schema=public',
      NUXT_SESSION_PASSWORD: 'dailyboost-playwright-session-secret-at-least-thirty-two-characters',
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: '3000'
    }
  }
})
