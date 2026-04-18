<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <h1 class="text-xl font-bold">Comidas</h1>
      <div class="flex gap-2 flex-wrap">
        <NuxtLink to="/simulator" class="btn-ghost no-underline">🧪 Simular</NuxtLink>
        <button class="btn-ghost" @click="showTemplates = true">📋 Plantillas</button>
        <button class="btn-ghost" :disabled="!hasYesterday" @click="copyYesterday">↻ Copiar ayer</button>
        <button class="btn-primary" @click="showForm = true">+ Añadir</button>
      </div>
    </div>

    <!-- Daily summary -->
    <div class="card-base grid grid-cols-4 gap-2 text-center">
      <div v-for="s in summary" :key="s.label">
        <div class="font-mono font-semibold text-lg" :class="s.color">{{ s.value }}</div>
        <div class="text-[10px] text-muted mt-0.5">{{ s.label }}</div>
      </div>
    </div>

    <!-- Macro Pie -->
    <MacroPie
      v-if="store.todayProtein || store.todayCarbs || store.todayFat"
      :protein="store.todayProtein"
      :carbs="store.todayCarbs"
      :fat="store.todayFat"
    />

    <!-- Weekly bar chart -->
    <div class="card-base">
      <p class="section-label">Kcal diarias — últimos 7 días</p>
      <div class="relative h-32">
        <canvas ref="barCanvas" />
      </div>
    </div>

    <!-- Meal list (grouped by type) -->
    <div v-for="(group, type) in groupedMeals" :key="type">
      <p class="section-label">{{ type }}</p>
      <div
        v-for="meal in group"
        :key="meal.id"
        v-swipe-left="() => removeMeal(meal.id)"
        class="card-base mb-2 flex justify-between items-start gap-3 touch-pan-y"
      >
        <MealThumb :photo-id="meal.photoId" :alt="meal.name" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">
            {{ meal.name }}
            <span v-if="meal.portionGrams" class="text-muted text-xs">· {{ meal.portionGrams }}g</span>
          </p>
          <div class="flex flex-wrap gap-2.5 mt-1.5 text-xs font-mono">
            <span v-if="meal.calories" class="text-green">{{ meal.calories }} kcal</span>
            <span v-if="meal.protein" class="text-blue">{{ meal.protein }}g prot</span>
            <span v-if="meal.carbs" class="text-orange">{{ meal.carbs }}g carbs</span>
            <span v-if="meal.fat" class="text-purple">{{ meal.fat }}g fat</span>
          </div>
          <p v-if="meal.notes" class="text-[11px] text-muted mt-1">{{ meal.notes }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="edit-btn" aria-label="Editar comida" @click="editing = meal">✎</button>
          <button class="del-btn" aria-label="Borrar comida" @click="removeMeal(meal.id)">×</button>
        </div>
      </div>
    </div>

    <div v-if="!store.todayMeals.length" class="card-base text-center py-10 text-muted">
      <p class="text-3xl mb-2">🍽</p>
      <p>Sin comidas registradas hoy</p>
    </div>

    <!-- Modal -->
    <Modal v-if="showForm" @close="showForm = false">
      <MealForm @saved="showForm = false" @cancel="showForm = false" />
    </Modal>
    <Modal v-if="editing" @close="editing = null">
      <MealForm :initial="editing" @saved="editing = null" @cancel="editing = null" />
    </Modal>
    <Modal v-if="showTemplates" @close="showTemplates = false">
      <TemplatesManager @close="showTemplates = false" />
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
import { yesterdayStr } from '~/utils/dates'
import type { Meal } from '~/types'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const store = useAppStore()
const toast = useToast()
const showForm = ref(false)
const showTemplates = ref(false)
const editing = ref<Meal | null>(null)

const hasYesterday = computed(() => store.meals.some((m) => m.date === yesterdayStr()))

const copyYesterday = () => {
  const n = store.copyMealsFromYesterday()
  if (n) toast.push(`${n} comida${n === 1 ? '' : 's'} copiada${n === 1 ? '' : 's'} de ayer`, { variant: 'success' })
  else toast.push('No hay comidas de ayer para copiar', { variant: 'info' })
}

const removeMeal = (id: string) => {
  const removed = store.deleteMeal(id)
  if (!removed) return
  toast.push(`Comida «${removed.name}» borrada`, {
    action: { label: 'Deshacer', run: () => store.restoreMeal(removed) },
  })
}
const barCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const summary = computed(() => [
  { label: 'Kcal', value: store.todayCalIn, color: 'text-green' },
  { label: 'Prot', value: `${store.todayProtein}g`, color: 'text-blue' },
  { label: 'Carbs', value: `${store.todayCarbs}g`, color: 'text-orange' },
  { label: 'Fat', value: `${store.todayFat}g`, color: 'text-purple' },
])

const groupedMeals = computed(() => {
  const groups: Record<string, typeof store.todayMeals> = {}
  for (const meal of store.todayMeals) {
    if (!groups[meal.mealType]) groups[meal.mealType] = []
    groups[meal.mealType].push(meal)
  }
  return groups
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
        data: store.weekStats.map((d) => d.calIn),
        backgroundColor: '#7fff6e88',
        borderColor: '#7fff6e',
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
