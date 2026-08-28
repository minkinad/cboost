<script setup lang="ts">
import type { FetchError } from 'ofetch'

const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const form = reactive({ email: '', password: '' })
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await refreshSession()
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/'
    await navigateTo(next)
  } catch (error) {
    errorMessage.value = (error as FetchError).data?.statusMessage || 'Не удалось войти'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="auth-shell">
    <section class="panel-card auth-card">
      <p class="eyebrow">DailyBoost 2.0</p>
      <h1>Вход</h1>
      <form class="habit-form" @submit.prevent="submit">
        <label>Email <input v-model="form.email" type="email" autocomplete="email" required></label>
        <label>Пароль <input v-model="form.password" type="password" autocomplete="current-password" required></label>
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
        <button class="primary-btn" type="submit" :disabled="pending">{{ pending ? 'Входим…' : 'Войти' }}</button>
      </form>
      <p class="auth-switch">Нет аккаунта? <NuxtLink to="/register">Зарегистрироваться</NuxtLink></p>
    </section>
  </main>
</template>
