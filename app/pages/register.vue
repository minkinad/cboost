<script setup lang="ts">
import type { FetchError } from 'ofetch'
import { registerInputSchema, type RegisterInput } from '~~/shared/schemas/auth'

definePageMeta({ layout: 'auth' })

const { fetch: refreshSession } = useUserSession()
const form = reactive<RegisterInput>({
  email: '',
  password: '',
  displayName: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
})
const displayNameModel = computed<string>({
  get: () => form.displayName ?? '',
  set: (value) => { form.displayName = value || null }
})
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: registerInputSchema.parse(form)
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
  <section class="auth-card">
      <p class="eyebrow">DailyBoost 2.0</p>
      <h1>Регистрация</h1>
      <UForm :schema="registerInputSchema" :state="form" class="habit-form" @submit="submit">
        <UFormField label="Имя" name="displayName" hint="Необязательно"><UInput v-model="displayNameModel" maxlength="80" autocomplete="name" size="lg" class="w-full" /></UFormField>
        <UFormField label="Email" name="email" required><UInput v-model="form.email" type="email" autocomplete="email" size="lg" class="w-full" /></UFormField>
        <UFormField label="Пароль" name="password" hint="Минимум 12 символов" required><UInput v-model="form.password" type="password" minlength="12" maxlength="128" autocomplete="new-password" size="lg" class="w-full" /></UFormField>
        <UFormField label="Часовой пояс" name="timezone" required><UInput v-model="form.timezone" maxlength="100" size="lg" class="w-full" /></UFormField>
        <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
        <UButton type="submit" size="lg" block :loading="pending">Создать аккаунт</UButton>
      </UForm>
      <p class="auth-switch">Уже есть аккаунт? <NuxtLink to="/login">Войти</NuxtLink></p>
  </section>
</template>
