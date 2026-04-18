<template>
  <nav
    class="bg-card border-t border-border flex justify-around shrink-0"
    style="padding-bottom: max(8px, env(safe-area-inset-bottom))"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-col items-center gap-1 px-3 py-2 min-w-[52px] text-muted transition-colors duration-200 no-underline"
      active-class="!text-green"
    >
      <span class="text-xl leading-none">{{ tab.icon }}</span>
      <span class="text-[10px] font-medium">{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const tabs = [
  { to: '/', icon: '◉', label: 'Inicio' },
  { to: '/meals', icon: '⬡', label: 'Comidas' },
  { to: '/exercise', icon: '△', label: 'Ejercicio' },
  { to: '/body', icon: '◎', label: 'Cuerpo' },
  { to: '/summary', icon: '◇', label: 'Resumen' },
  { to: '/report', icon: '▤', label: 'Informe' },
]
</script>
