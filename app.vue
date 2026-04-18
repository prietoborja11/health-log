<template>
  <div class="flex flex-col h-full bg-bg text-text font-sans overflow-hidden">
    <AppHeader />
    <main class="flex-1 overflow-y-auto overscroll-none">
      <div class="max-w-xl mx-auto px-4 py-5 pb-6">
        <NuxtPage />
      </div>
    </main>
    <AppNav />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useNotifications } from '~/composables/useNotifications'
import { todayStr } from '~/utils/dates'

const store = useAppStore()
const notif = useNotifications()

const hasDataToday = () => {
  const t = todayStr()
  return (
    store.meals.some((m) => m.date === t) ||
    store.exercises.some((e) => e.date === t) ||
    store.body.some((b) => b.date === t) ||
    store.water.some((w) => w.date === t)
  )
}

onMounted(() => {
  store.init()
  notif.maybeRemind(hasDataToday())
})
</script>
