<template>
  <div class="card-base">
    <p class="section-label">Distribución calórica</p>
    <div class="flex items-center gap-5">
      <div style="width: 110px; height: 110px; flex-shrink: 0">
        <canvas ref="canvas" />
      </div>
      <div class="flex flex-col gap-2 flex-1">
        <div
          v-for="item in items"
          :key="item.label"
          class="flex items-center gap-2 text-xs"
        >
          <div class="w-2 h-2 rounded-full shrink-0" :style="{ background: item.color }" />
          <span class="text-muted flex-1">{{ item.label }}</span>
          <span class="font-mono" :style="{ color: item.color }">{{ item.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js'
Chart.register(DoughnutController, ArcElement, Tooltip)

const props = defineProps<{
  protein: number
  carbs: number
  fat: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const protCal = computed(() => props.protein * 4)
const carbCal = computed(() => props.carbs * 4)
const fatCal = computed(() => props.fat * 9)
const total = computed(() => protCal.value + carbCal.value + fatCal.value)

const items = computed(() => [
  { label: 'Proteína', value: protCal.value, color: '#4f9eff' },
  { label: 'Carbohidratos', value: carbCal.value, color: '#ffb347' },
  { label: 'Grasas', value: fatCal.value, color: '#b97fff' },
].map((i) => ({ ...i, pct: total.value > 0 ? Math.round((i.value / total.value) * 100) : 0 })))

const buildChart = () => {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: items.value.map((i) => i.value),
        backgroundColor: items.value.map((i) => i.color),
        borderWidth: 0,
        hoverOffset: 4,
      }],
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
