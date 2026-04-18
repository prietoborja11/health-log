<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Ejercicio</h1>
      <button class="btn-primary" @click="showForm = true">+ Añadir</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-2.5">
      <StatCard label="Tiempo activo" :value="totalMin" unit="min" color-class="text-red" />
      <StatCard label="Kcal quemadas" :value="totalBurned" unit="kcal" color-class="text-orange" />
    </div>

    <!-- Weekly burned chart -->
    <div class="card-base">
      <p class="section-label">Kcal quemadas — últimos 7 días</p>
      <div class="relative h-32">
        <canvas ref="barCanvas" />
      </div>
    </div>

    <!-- Category breakdown -->
    <div v-if="categoryTotals.length" class="card-base">
      <p class="section-label">Por categoría — hoy</p>
      <div class="flex flex-col gap-2">
        <div
          v-for="cat in categoryTotals"
          :key="cat.name"
          class="flex items-center gap-3 text-sm"
        >
          <span class="text-muted flex-1">{{ cat.name }}</span>
          <span class="font-mono text-red text-xs">{{ cat.duration }}min</span>
          <span class="font-mono text-orange text-xs">{{ cat.burned }}kcal</span>
        </div>
      </div>
    </div>

    <!-- Exercise list -->
    <div>
      <p class="section-label">Hoy</p>
      <div v-if="!store.todayExercises.length" class="card-base text-center py-10 text-muted">
        <p class="text-3xl mb-2">💪</p>
        <p>Sin ejercicios registrados hoy</p>
      </div>
      <div
        v-for="ex in store.todayExercises"
        :key="ex.id"
        v-swipe-left="() => removeExercise(ex.id)"
        class="card-base mb-2 flex justify-between items-start gap-3 touch-pan-y"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="tag">{{ ex.category }}</span>
            <span class="font-medium text-sm truncate">{{ ex.name }}</span>
          </div>
          <div v-if="ex.category === 'Fuerza' && ex.sets?.length" class="flex flex-col gap-0.5 text-xs font-mono">
            <span
              v-for="(set, i) in ex.sets"
              :key="i"
              class="text-muted"
            >
              <span class="text-blue">{{ set.weight ?? '–' }}kg</span>
              <span class="mx-1">×</span>
              <span class="text-orange">{{ set.reps ?? '–' }} reps</span>
            </span>
            <span class="text-muted mt-1">Intensidad {{ ex.intensity }}/5</span>
          </div>
          <div v-else-if="ex.category === 'Pasos'" class="flex flex-wrap gap-2.5 text-xs font-mono">
            <span v-if="ex.steps" class="text-green">{{ ex.steps.toLocaleString('es-ES') }} pasos</span>
            <span v-if="ex.distance" class="text-blue">{{ ex.distance }} km</span>
            <span v-if="ex.caloriesBurned" class="text-red">{{ ex.caloriesBurned }} kcal</span>
            <span class="text-muted">Intensidad {{ ex.intensity }}/5</span>
          </div>
          <div v-else class="flex flex-wrap gap-2.5 text-xs font-mono">
            <span v-if="ex.duration" class="text-orange">{{ ex.duration }} min</span>
            <span v-if="ex.caloriesBurned" class="text-red">{{ ex.caloriesBurned }} kcal</span>
            <span class="text-muted">Intensidad {{ ex.intensity }}/5</span>
          </div>
          <p v-if="ex.notes" class="text-[11px] text-muted mt-1">{{ ex.notes }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="edit-btn" aria-label="Editar ejercicio" @click="editing = ex">✎</button>
          <button class="del-btn" aria-label="Borrar ejercicio" @click="removeExercise(ex.id)">×</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Modal v-if="showForm" @close="showForm = false">
      <ExerciseForm @saved="showForm = false" @cancel="showForm = false" />
    </Modal>
    <Modal v-if="editing" @close="editing = null">
      <ExerciseForm :initial="editing" @saved="editing = null" @cancel="editing = null" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { sumField } from '~/utils/calculations'
import type { Exercise } from '~/types'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const store = useAppStore()
const toast = useToast()
const showForm = ref(false)
const editing = ref<Exercise | null>(null)

const removeExercise = (id: string) => {
  const removed = store.deleteExercise(id)
  if (!removed) return
  toast.push(`Ejercicio «${removed.name}» borrado`, {
    action: { label: 'Deshacer', run: () => store.restoreExercise(removed) },
  })
}
const barCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const totalMin = computed(() => sumField(store.todayExercises, 'duration'))
const totalBurned = computed(() => sumField(store.todayExercises, 'caloriesBurned'))

const categoryTotals = computed(() => {
  const map: Record<string, { duration: number; burned: number }> = {}
  for (const ex of store.todayExercises) {
    if (!map[ex.category]) map[ex.category] = { duration: 0, burned: 0 }
    map[ex.category].duration += Number(ex.duration) || 0
    map[ex.category].burned += Number(ex.caloriesBurned) || 0
  }
  return Object.entries(map).map(([name, v]) => ({ name, ...v }))
})

const buildBar = () => {
  if (!barCanvas.value) return
  chart?.destroy()
  chart = new Chart(barCanvas.value, {
    type: 'bar',
    data: {
      labels: store.weekStats.map((d) => d.label),
      datasets: [{
        label: 'Kcal',
        data: store.weekStats.map((d) => d.calOut),
        backgroundColor: '#ff6b6b88',
        borderColor: '#ff6b6b',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d0d1a', borderColor: '#181828', borderWidth: 1, titleColor: '#52527a', bodyColor: '#e8e8f0', padding: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#52527a', font: { size: 11 } }, border: { display: false } },
        y: { grid: { color: '#181828' }, ticks: { color: '#52527a', font: { size: 11 } }, border: { display: false } },
      },
    },
  })
}

onMounted(buildBar)
watch(() => store.weekStats, buildBar, { deep: true })
onUnmounted(() => chart?.destroy())
</script>
