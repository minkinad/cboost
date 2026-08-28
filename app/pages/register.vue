<script setup lang="ts">
import type { FetchError } from 'ofetch'

const { fetch: refreshSession } = useUserSession()
const form = reactive({
  email: '',
  password: '',
  displayName: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
})
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { ...form, displayName: form.displayName || null }
    })
    await refreshSession()
    await navigateTo('/')
  } catch (error) {
    errorMessage.value = (error as FetchError).data?.statusMessage || 'Не удалось зарегистрироваться'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="auth-shell">
    <section class="panel-card auth-card">
      <p class="eyebrow">DailyBoost 2.0</p>
      <h1>Регистрация</h1>
      <form class="habit-form" @submit.prevent="submit">
        <label>Имя <input v-model="form.displayName" maxlength="80" autocomplete="name"></label>
        <label>Email <input v-model="form.email" type="email" autocomplete="email" required></label>
        <label>Пароль <input v-model="form.password" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></label>
        <label>Часовой пояс <input v-model="form.timezone" maxlength="100" required></label>
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
        <button class="primary-btn" type="submit" :disabled="pending">{{ pending ? 'Создаём…' : 'Создать аккаунт' }}</button>
      </form>
      <p class="auth-switch">Уже есть аккаунт? <NuxtLink to="/login">Войти</NuxtLink></p>
    </section>
  </main>
</template>
