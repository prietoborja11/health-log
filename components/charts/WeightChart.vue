<template>
  <div class="card-base">
    <p class="section-label">{{ title ?? 'Evolución del peso' }}</p>
    <div class="relative h-36">
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const props = defineProps<{
  labels: string[]
  data: (number | null)[]
  color?: string
  unit?: string
  title?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const buildChart = () => {
  if (!canvas.value) return
  chart?.destroy()
  const color = props.color ?? '#7fff6e'
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.unit ?? 'kg',
          data: props.data,
          borderColor: color,
          backgroundColor: color + '22',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: color,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d0d1a',
          borderColor: '#181828',
          borderWidth: 1,
          titleColor: '#52527a',
          bodyColor: '#e8e8f0',
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#52527a', font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: '#181828' },
          ticks: { color: '#52527a', font: { size: 11 } },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(buildChart)
watch(() => props.data, buildChart, { deep: true })
onUnmounted(() => chart?.destroy())
</script>
