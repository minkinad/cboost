<script setup lang="ts">
const route = useRoute()
const habitId = computed(() => String(route.params.id))
</script>

<template>
  <HabitDetailView :habit-id="habitId" />
</template>
