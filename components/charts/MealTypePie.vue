<template>
  <div class="card-base">
    <p class="section-label">Distribución kcal por tipo de comida</p>
    <div v-if="total === 0" class="text-center text-muted text-sm py-4">
      No hay datos suficientes en el rango.
    </div>
    <div v-else class="flex items-center gap-5">
      <div style="width: 110px; height: 110px; flex-shrink: 0">
        <canvas ref="canvas" />
      </div>
      <div class="flex flex-col gap-1.5 flex-1 text-xs">
        <div
          v-for="item in items"
          :key="item.label"
          class="flex items-center gap-2"
        >
          <div class="w-2 h-2 rounded-full shrink-0" :style="{ background: item.color }" />
          <span class="text-muted flex-1 truncate">{{ item.label }}</span>
          <span class="font-mono" :style="{ color: item.color }">{{ item.pct }}%</span>
          <span class="font-mono text-muted">{{ item.value }}kcal</span>
        </div>
      </div>
    </div>
    <p v-if="warning" class="text-[11px] text-orange mt-2">⚠ {{ warning }}</p>
  </div>
</template>

<script setup lang="ts">
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js'
import type { Meal, MealType } from '~/types'

Chart.register(DoughnutController, ArcElement, Tooltip)

const props = defineProps<{ meals: Meal[] }>()

const COLORS: Record<MealType, string> = {
  Desayuno: '#7fff6e',
  Almuerzo: '#4f9eff',
  Merienda: '#ffb347',
  Cena: '#b97fff',
  Snack: '#ff6b6b',
  'Pre-entreno': '#6eeeff',
  'Post-entreno': '#ffee6e',
}

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const grouped = computed(() => {
  const map: Record<string, number> = {}
  for (const m of props.meals) {
    const k = m.mealType
    map[k] = (map[k] || 0) + (Number(m.calories) || 0)
  }
  return map
})

const total = computed(() =>
  Object.values(grouped.value).reduce((s, v) => s + v, 0),
)

const items = computed(() =>
  Object.entries(grouped.value)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value: Math.round(value),
      color: COLORS[label as MealType] ?? '#666',
      pct: total.value > 0 ? Math.round((value / total.value) * 100) : 0,
    })),
)

const warning = computed(() => {
  const cena = items.value.find((i) => i.label === 'Cena')
  if (cena && cena.pct >= 50) {
    return `La cena supone ${cena.pct}% de tus kcal. Si te acuestas pronto, puede afectar al descanso.`
  }
  const snack = items.value.find((i) => i.label === 'Snack')
  if (snack && snack.pct >= 30) {
    return `Los snacks son ${snack.pct}% de tus kcal. Podrían estar inflando el total sin saciarte.`
  }
  return null
})

const buildChart = () => {
  if (!canvas.value) return
  chart?.destroy()
  if (!items.value.length) return
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: items.value.map((i) => i.label),
      datasets: [
        {
          data: items.value.map((i) => i.value),
          backgroundColor: items.value.map((i) => i.color),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      cutout: '60%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  })
}

onMounted(buildChart)
watch(items, buildChart, { deep: true })
onUnmounted(() => chart?.destroy())
</script>
