// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui', 'nuxt-auth-utils'],
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
            'Трекер задач и привычек со статистикой за неделю и месяц, мотивационными напоминаниями и современным интерфейсом.'
        }
      ],
      link: []
    }
  },
  ui: {
    colorMode: false,
    fonts: false
  },
  runtimeConfig: {
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
