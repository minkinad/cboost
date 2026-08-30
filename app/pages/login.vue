<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { loginInputSchema, type LoginInput } from '~~/shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const form = reactive<LoginInput>({ email: '', password: '' })
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
  <section class="auth-card">
      <p class="eyebrow">DailyBoost 2.0</p>
      <h1>Вход</h1>
      <UForm :schema="loginInputSchema" :state="form" class="habit-form" @submit="submit">
        <UFormField label="Email" name="email" required><UInput v-model="form.email" type="email" autocomplete="email" size="lg" class="w-full" /></UFormField>
        <UFormField label="Пароль" name="password" required><UInput v-model="form.password" type="password" autocomplete="current-password" size="lg" class="w-full" /></UFormField>
        <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
        <UButton type="submit" size="lg" block :loading="pending">Войти</UButton>
      </UForm>
      <p class="auth-switch">Нет аккаунта? <NuxtLink to="/register">Зарегистрироваться</NuxtLink></p>
  </section>
</template>
