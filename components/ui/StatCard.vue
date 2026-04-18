<template>
  <div class="card-base flex-1">
    <div class="section-label mb-2">{{ label }}</div>
    <div class="font-mono font-semibold text-2xl" :class="colorClass">
      {{ value ?? '–' }}<span class="text-xs text-muted ml-1">{{ unit }}</span>
    </div>
    <div v-if="sub" class="text-[11px] text-muted mt-1">{{ sub }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value?: number | string | null
  unit?: string
  colorClass?: string
  sub?: string | null
}>()
</script>
