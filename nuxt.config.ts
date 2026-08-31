// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils',
    ...(process.env.VITEST ? [] : ['@vite-pwa/nuxt' as const])
  ],
  css: ['~/assets/styles/main.css'],
  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/features', pathPrefix: false }
  ],
  typescript: {
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        strict: true,
        noUncheckedIndexedAccess: true
      }
    }
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'DailyBoost',
      meta: [
        {
          name: 'description',
          content:
            'Приватный трекер привычек с детерминированной аналитикой, целями, напоминаниями и контролируемой offline-синхронизацией.'
        }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/dailyboost-mark.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }
      ]
    }
  },
  ui: {
    colorMode: false,
    fonts: false
  },
  pwa: {
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'dailyboost-mark.svg', 'offline.html'],
    manifest: {
      name: 'DailyBoost',
      short_name: 'DailyBoost',
      description: 'Private, deterministic habit tracking and personal analytics.',
      theme_color: '#315c4c',
      background_color: '#f6f7f4',
      display: 'standalone',
      orientation: 'portrait-primary',
      start_url: '/',
      scope: '/',
      categories: ['productivity', 'health', 'lifestyle'],
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/offline.html',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      cleanupOutdatedCaches: true
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 60 * 60
    },
    devOptions: {
      enabled: false
    }
  },
  runtimeConfig: {
    appOrigin: process.env.APP_ORIGIN || '',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
      maxAge: 60 * 60 * 24 * 30,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server'
  }
})
