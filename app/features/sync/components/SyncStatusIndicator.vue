<script setup lang="ts">
import { useOfflineSync, type SyncStatus } from '../composables/useOfflineSync'

const { status, pendingCount, flush } = useOfflineSync()
const labels: Record<SyncStatus, string> = { SYNCED: 'Synced', SAVING: 'Saving', SAVED_OFFLINE: 'Saved offline', SYNCING: 'Syncing', SYNC_FAILED: 'Sync failed' }
const icons: Record<SyncStatus, string> = { SYNCED: 'i-lucide-cloud-check', SAVING: 'i-lucide-loader-circle', SAVED_OFFLINE: 'i-lucide-cloud-off', SYNCING: 'i-lucide-refresh-cw', SYNC_FAILED: 'i-lucide-cloud-alert' }
</script>

<template>
  <button class="sync-indicator" :class="status.toLowerCase()" type="button" :title="status === 'SYNC_FAILED' ? 'Повторить синхронизацию' : labels[status]" @click="status === 'SYNC_FAILED' && flush()">
    <UIcon :name="icons[status]" /><span>{{ labels[status] }}</span><b v-if="pendingCount">{{ pendingCount }}</b>
  </button>
</template>
