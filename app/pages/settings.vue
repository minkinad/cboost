<script setup lang="ts">
const { user, fetch: refreshSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="feature-page narrow-page">
    <header class="page-heading"><div><p class="page-kicker">Аккаунт</p><h1>Настройки</h1><p>Профиль и календарный контекст DailyBoost.</p></div></header>
    <section class="surface-card settings-card">
      <div class="settings-profile"><div class="account-avatar large">{{ (user?.displayName || user?.email || 'D').slice(0, 1).toUpperCase() }}</div><div><h2>{{ user?.displayName || 'Пользователь DailyBoost' }}</h2><p>{{ user?.email }}</p></div></div>
      <dl class="settings-list"><div><dt>Часовой пояс</dt><dd><UIcon name="i-lucide-globe-2" /> {{ user?.timezone || 'UTC' }}</dd></div><div><dt>Модель календаря</dt><dd>День определяется в вашем IANA timezone</dd></div></dl>
      <UAlert color="neutral" variant="subtle" icon="i-lucide-info" title="Timezone влияет на Today, streak и history" description="Изменение профиля появится на следующем этапе настроек аккаунта." />
    </section>
    <section class="surface-card settings-card"><div class="section-title"><div><h2>Сессия</h2><p>Завершить текущий вход на этом устройстве.</p></div></div><UButton color="neutral" variant="soft" icon="i-lucide-log-out" @click="logout">Выйти из аккаунта</UButton></section>
    <CategoriesManager />
  </div>
</template>
