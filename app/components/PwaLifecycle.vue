<script setup lang="ts">
const pwa = usePWA()
const installDismissed = ref(false)

const canInstall = computed(() => Boolean(pwa?.showInstallPrompt && !pwa.isPWAInstalled && !installDismissed.value))
const needsUpdate = computed(() => Boolean(pwa?.needRefresh))
const offlineReady = computed(() => Boolean(pwa?.offlineReady))

async function install() {
  await pwa?.install()
}

function dismissInstall() {
  installDismissed.value = true
}
</script>

<template>
  <div class="pwa-lifecycle" aria-live="polite">
    <UAlert v-if="needsUpdate" color="primary" variant="solid" icon="i-lucide-refresh-cw" title="Доступна новая версия" description="Обновите DailyBoost, чтобы применить изменения.">
      <template #actions><UButton color="neutral" variant="solid" size="sm" @click="pwa?.updateServiceWorker(true)">Обновить</UButton></template>
    </UAlert>
    <UAlert v-else-if="canInstall" color="neutral" variant="solid" icon="i-lucide-download" title="Установить DailyBoost" description="Добавьте приложение на главный экран.">
      <template #actions><UButton size="sm" @click="install">Установить</UButton><UButton color="neutral" variant="ghost" size="sm" @click="dismissInstall">Позже</UButton></template>
    </UAlert>
    <UAlert v-else-if="offlineReady" color="neutral" variant="subtle" icon="i-lucide-wifi-off" title="Приложение готово к работе офлайн" />
  </div>
</template>
