<script setup lang="ts">
const route = useRoute()
const { user, fetch: refreshSession } = useUserSession()

const navigation = [
  { label: 'Сегодня', to: '/', icon: 'i-lucide-sun' },
  { label: 'Привычки', to: '/habits', icon: 'i-lucide-list-checks' },
  { label: 'Прогресс', to: '/progress', icon: 'i-lucide-chart-no-axes-combined' },
  { label: 'Цели', to: '/goals', icon: 'i-lucide-goal' },
  { label: 'Настройки', to: '/settings', icon: 'i-lucide-settings' }
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="desktop-sidebar">
      <NuxtLink class="app-brand" to="/" aria-label="DailyBoost — сегодня">
        <span class="brand-mark">D</span>
        <span>DailyBoost</span>
      </NuxtLink>

      <nav class="desktop-navigation" aria-label="Основная навигация">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="navigation-link"
          :class="{ active: isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <UIcon :name="item.icon" class="size-5" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-account">
        <div class="account-avatar">{{ (user?.displayName || user?.email || 'D').slice(0, 1).toUpperCase() }}</div>
        <div class="account-copy">
          <strong>{{ user?.displayName || 'Профиль' }}</strong>
          <span>{{ user?.email }}</span>
        </div>
        <UTooltip text="Выйти">
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="Выйти из аккаунта"
            @click="logout"
          />
        </UTooltip>
      </div>
    </aside>

    <div class="app-main">
      <header class="mobile-header">
        <NuxtLink class="app-brand" to="/" aria-label="DailyBoost — сегодня">
          <span class="brand-mark">D</span>
          <span>DailyBoost</span>
        </NuxtLink>
        <UTooltip text="Выйти">
          <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="Выйти из аккаунта" @click="logout" />
        </UTooltip>
      </header>

      <main class="route-content">
        <slot />
      </main>
    </div>

    <nav class="mobile-navigation" aria-label="Мобильная навигация">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="mobile-navigation-link"
        :class="{ active: isActive(item.to) }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <UIcon :name="item.icon" class="size-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
