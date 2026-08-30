import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1
      },
      mutations: {
        retry: 0
      }
    }
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
