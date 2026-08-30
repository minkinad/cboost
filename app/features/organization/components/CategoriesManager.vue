<script setup lang="ts">
import { categoryCreateInputSchema, type CategoryCreateInput } from '~~/shared/schemas/organization'
import { useOrganizationMutations } from '../composables/useOrganizationMutations'
import { useCategoriesQuery } from '../composables/useOrganizationQueries'

const categoriesQuery = useCategoriesQuery()
const { createCategory, deleteCategory } = useOrganizationMutations()
const state = reactive<CategoryCreateInput>({ name: '', icon: null, color: '#315c4c' })

async function create() {
  await createCategory.mutateAsync(categoryCreateInputSchema.parse(state))
  state.name = ''
}
</script>

<template>
  <section class="surface-card settings-card">
    <div class="section-title"><div><h2>Категории</h2><p>Собственные области для группировки привычек.</p></div></div>
    <UForm :schema="categoryCreateInputSchema" :state="state" class="category-form" @submit="create">
      <UFormField label="Название" name="name"><UInput v-model="state.name" maxlength="60" placeholder="Например, Здоровье" /></UFormField>
      <UFormField label="Цвет" name="color"><input v-model="state.color" type="color" class="native-color-input"></UFormField>
      <UButton type="submit" icon="i-lucide-plus" :loading="createCategory.isPending.value">Добавить</UButton>
    </UForm>
    <div v-if="categoriesQuery.data.value?.length" class="category-list">
      <div v-for="category in categoriesQuery.data.value" :key="category.id" class="category-chip"><i :style="{ backgroundColor: category.color || '#64748b' }" /><span>{{ category.name }}</span><UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" :aria-label="`Удалить ${category.name}`" :loading="deleteCategory.isPending.value && deleteCategory.variables.value === category.id" @click="deleteCategory.mutate(category.id)" /></div>
    </div>
    <p v-else-if="!categoriesQuery.isPending.value" class="muted-empty">Категорий пока нет.</p>
  </section>
</template>
