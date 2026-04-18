<template>
  <div>
    <div class="flex justify-between text-xs mb-1.5">
      <span class="text-muted">{{ label }}</span>
      <span class="font-mono" :class="colorClass">
        {{ value }}{{ unit }}
        <span v-if="goal" class="text-muted"> / {{ goal }}{{ unit }}</span>
      </span>
    </div>
    <div class="h-1 bg-border rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700"
        :class="barClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { pct } from '~/utils/calculations'

const props = defineProps<{
  label: string
  value: number
  goal?: number
  unit?: string
  colorClass?: string
  barClass?: string
}>()

const percentage = computed(() =>
  props.goal ? pct(props.value, props.goal) : Math.min(100, (props.value / 200) * 100),
)
</script>
