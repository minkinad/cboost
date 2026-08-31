import { useOfflineSync } from '../features/sync/composables/useOfflineSync'

export default defineNuxtPlugin({
  name: 'offline-sync',
  dependsOn: ['vue-query'],
  setup(nuxtApp) {
    const { initialize } = useOfflineSync()
    let cleanup: (() => void) | undefined
    nuxtApp.hook('app:mounted', () => { cleanup = initialize() })
    nuxtApp.hook('app:error', () => cleanup?.())
  }
})
