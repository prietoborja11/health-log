<template>
  <div class="card-base flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <div class="text-3xl">{{ status.isPerfect ? '🏆' : '🔥' }}</div>
      <div class="flex-1">
        <p class="text-lg font-bold">
          <span class="text-green">{{ streak }}</span>
          <span class="text-muted text-xs font-normal ml-1">días seguidos</span>
        </p>
        <p class="text-[11px] text-muted">
          {{
            status.isPerfect
              ? '¡Día perfecto conseguido!'
              : `Día perfecto: ${status.met} de ${status.total}`
          }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-1.5">
      <div
        v-for="item in items"
        :key="item.key"
        class="flex flex-col items-center gap-1 text-[10px]"
        :class="item.ok ? 'text-green' : 'text-muted'"
      >
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center border text-xs"
          :class="item.ok ? 'border-green bg-green/10' : 'border-border'"
        >
          {{ item.ok ? '✓' : item.icon }}
        </div>
        <span class="text-center leading-tight">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PerfectDayStatus } from '~/utils/streak'

const props = defineProps<{
  streak: number
  status: PerfectDayStatus
}>()

const items = computed(() => [
  { key: 'kcal', label: 'Kcal en rango', ok: props.status.criteria.kcalInRange, icon: '🍽' },
  { key: 'prot', label: 'Proteína', ok: props.status.criteria.proteinOk, icon: '🥩' },
  { key: 'water', label: 'Agua', ok: props.status.criteria.waterOk, icon: '💧' },
  { key: 'ex', label: 'Ejercicio', ok: props.status.criteria.exerciseOk, icon: '💪' },
])
</script>
