<template>
  <div class="relative h-44">
    <canvas ref="canvas" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  ScatterController,
  PointElement,
  LinearScale,
  Tooltip,
} from 'chart.js'

Chart.register(ScatterController, PointElement, LinearScale, Tooltip)

const props = defineProps<{
  points: { x: number; y: number }[]
  xLabel: string
  yLabel: string
  color?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const build = () => {
  if (!canvas.value) return
  chart?.destroy()
  const color = props.color ?? '#7fff6e'
  chart = new Chart(canvas.value, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: `${props.yLabel} vs ${props.xLabel}`,
          data: props.points,
          backgroundColor: color,
          borderColor: color,
          pointRadius: 3.5,
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
          padding: 8,
          callbacks: {
            label: (ctx) => {
              const p = ctx.parsed as { x: number; y: number }
              return `${props.xLabel}: ${p.x} · ${props.yLabel}: ${p.y}`
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: props.xLabel, color: '#52527a', font: { size: 10 } },
          grid: { color: '#181828' },
          ticks: { color: '#52527a', font: { size: 10 } },
          border: { display: false },
        },
        y: {
          title: { display: true, text: props.yLabel, color: '#52527a', font: { size: 10 } },
          grid: { color: '#181828' },
          ticks: { color: '#52527a', font: { size: 10 } },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(build)
watch(() => props.points, build, { deep: true })
onUnmounted(() => chart?.destroy())
</script>
