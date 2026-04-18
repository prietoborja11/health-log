<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold">Resumen</h1>
        <NuxtLink to="/insights" class="btn-ghost no-underline">🔎 Insights</NuxtLink>
      </div>
      <div class="flex gap-1.5">
        <button
          v-for="r in RANGES"
          :key="r.days"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          :class="
            rangeDays === r.days
              ? 'bg-green text-bg border-green'
              : 'bg-surface text-muted border-border hover:text-green hover:border-green/40'
          "
          @click="rangeDays = r.days"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <p class="text-[11px] text-muted -mt-1">{{ rangeLabel }}</p>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-2.5">
      <StatCard label="Media kcal/día" :value="avg.calIn" unit="kcal" color-class="text-green" />
      <StatCard label="Media kcal quemadas" :value="avg.calOut" unit="kcal" color-class="text-red" />
      <StatCard label="Media proteína" :value="avg.protein" unit="g" color-class="text-blue" />
      <StatCard label="Balance neto" :value="avg.net" unit="kcal" :color-class="avg.net >= 0 ? 'text-orange' : 'text-blue'" />
    </div>

    <!-- Body snapshots -->
    <div v-if="bodyAgg" class="grid grid-cols-2 gap-2.5">
      <StatCard
        label="Peso medio"
        :value="bodyAgg.weight.avg ?? '–'"
        unit="kg"
        color-class="text-green"
        :sub="bodyAgg.weight.delta !== null ? `Δ ${bodyAgg.weight.delta > 0 ? '+' : ''}${bodyAgg.weight.delta} kg` : null"
      />
      <StatCard
        label="Sueño medio"
        :value="bodyAgg.sleep.avg ?? '–'"
        unit="h"
        color-class="text-blue"
        :sub="bodyAgg.sleep.count ? `${bodyAgg.sleep.count} noches registradas` : null"
      />
    </div>

    <!-- Adherence heatmap -->
    <div class="card-base">
      <AdherenceHeatmap
        title="Adherencia — días con registro de comidas"
        :days="adherenceDays"
      />
    </div>

    <!-- Meal type distribution -->
    <MealTypePie :meals="mealsInRange" />

    <!-- Kcal chart for range -->
    <CaloriesChart
      :labels="stats.map((d) => d.label)"
      :cal-in="stats.map((d) => d.calIn)"
      :cal-out="stats.map((d) => d.calOut)"
      :title="`Calorías — últimos ${rangeDays} días`"
    />

    <!-- Weight trend if available -->
    <WeightChart
      v-if="weightTrend.data.length > 1"
      :labels="weightTrend.labels"
      :data="weightTrend.data"
      title="Evolución del peso"
      unit="kg"
    />

    <!-- Activity totals -->
    <div class="card-base">
      <p class="section-label">Actividad</p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="font-mono font-semibold text-lg text-green">{{ totals.meals }}</div>
          <div class="text-[10px] text-muted mt-0.5">Comidas</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-lg text-red">{{ totals.exercises }}</div>
          <div class="text-[10px] text-muted mt-0.5">Ejercicios</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-lg text-blue">{{ totals.bodyEntries }}</div>
          <div class="text-[10px] text-muted mt-0.5">Reg. corporales</div>
        </div>
      </div>
    </div>

    <!-- Top exercise categories -->
    <div v-if="topCategories.length" class="card-base">
      <p class="section-label">Categorías más frecuentes</p>
      <div class="flex flex-col gap-2">
        <div
          v-for="cat in topCategories"
          :key="cat.name"
          class="flex items-center gap-3 text-sm"
        >
          <span class="text-muted flex-1">{{ cat.name }}</span>
          <span class="font-mono text-xs text-green">{{ cat.count }} ses.</span>
          <span v-if="cat.minutes" class="font-mono text-xs text-orange">{{ cat.minutes }} min</span>
          <span v-if="cat.kcal" class="font-mono text-xs text-red">{{ cat.kcal }} kcal</span>
        </div>
      </div>
    </div>

    <!-- Strength summary -->
    <div v-if="strength.totalVolume > 0" class="card-base">
      <p class="section-label">Fuerza · {{ strength.sessions }} sesiones</p>
      <div class="grid grid-cols-2 gap-2 text-center mb-3">
        <div>
          <div class="font-mono font-semibold text-lg text-green">{{ strength.totalVolume.toLocaleString('es-ES') }}</div>
          <div class="text-[10px] text-muted mt-0.5">Volumen total (kg)</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-lg text-blue">{{ strength.totalSets }}</div>
          <div class="text-[10px] text-muted mt-0.5">Series totales</div>
        </div>
      </div>
      <p class="text-[11px] text-muted mb-2">Top ejercicios por volumen</p>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="ex in strength.topLifts"
          :key="ex.name"
          class="flex items-center gap-3 text-xs"
        >
          <span class="flex-1 truncate">{{ ex.name }}</span>
          <span class="font-mono text-green">{{ ex.volume.toLocaleString('es-ES') }} kg</span>
          <span class="font-mono text-muted">· PR {{ ex.max }}kg</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { lastNDays, formatDate } from '~/utils/dates'
import { sumField } from '~/utils/calculations'

const store = useAppStore()

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]
const rangeDays = ref(30)

const dates = computed(() => lastNDays(rangeDays.value))
const stats = computed(() => store.statsForRange(dates.value))

const rangeLabel = computed(() => {
  const d = dates.value
  return `${formatDate(d[0])} — ${formatDate(d[d.length - 1])}`
})

const round = (n: number) => Math.round(n)

const avg = computed(() => {
  const n = stats.value.length || 1
  const calIn = round(stats.value.reduce((s, d) => s + d.calIn, 0) / n)
  const calOut = round(stats.value.reduce((s, d) => s + d.calOut, 0) / n)
  const protein = round(stats.value.reduce((s, d) => s + d.protein, 0) / n)
  return { calIn, calOut, protein, net: calIn - calOut }
})

const inRange = <T extends { date: string }>(arr: T[]) =>
  arr.filter((x) => dates.value.includes(x.date))

const mealsInRange = computed(() => inRange(store.meals))

const totals = computed(() => ({
  meals: inRange(store.meals).length,
  exercises: inRange(store.exercises).length,
  bodyEntries: inRange(store.body).length,
}))

const bodyAgg = computed(() => {
  const entries = inRange(store.body)
  if (!entries.length) return null
  const weights = entries.map((e) => e.weight).filter((w): w is number => w != null)
  const sleeps = entries.map((e) => e.sleepHours).filter((s): s is number => s != null)
  const avgW = weights.length ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null
  const avgS = sleeps.length ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : null
  const delta =
    weights.length >= 2 ? +(weights[weights.length - 1] - weights[0]).toFixed(1) : null
  return {
    weight: { avg: avgW, delta },
    sleep: { avg: avgS, count: sleeps.length },
  }
})

const weightTrend = computed(() => {
  const entries = inRange(store.body).filter((e) => e.weight)
  return {
    labels: entries.map((e) => formatDate(e.date)),
    data: entries.map((e) => Number(e.weight)),
  }
})

const topCategories = computed(() => {
  const map: Record<string, { count: number; minutes: number; kcal: number }> = {}
  for (const ex of inRange(store.exercises)) {
    if (!map[ex.category]) map[ex.category] = { count: 0, minutes: 0, kcal: 0 }
    map[ex.category].count += 1
    map[ex.category].minutes += Number(ex.duration) || 0
    map[ex.category].kcal += Number(ex.caloriesBurned) || 0
  }
  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const adherenceDays = computed(() => {
  const gCal = Number(store.profile.goalCalories) || 0
  return dates.value.map((date) => {
    const s = store.statsForDate(date)
    const hasAny = s.calIn > 0 || s.calOut > 0 || s.water > 0
    if (!hasAny) return { date, value: 0 }
    if (gCal > 0) {
      const ratio = Math.min(1.2, s.calIn / gCal)
      return { date, value: Math.max(0.2, Math.min(1, ratio)) }
    }
    return { date, value: 1 }
  })
})

const strength = computed(() => {
  const strengthEx = inRange(store.exercises).filter(
    (e) => e.category === 'Fuerza' && e.sets?.length,
  )
  let totalVolume = 0
  let totalSets = 0
  const byName: Record<string, { volume: number; max: number }> = {}
  for (const ex of strengthEx) {
    const key = ex.name.trim()
    if (!byName[key]) byName[key] = { volume: 0, max: 0 }
    for (const s of ex.sets ?? []) {
      const w = Number(s.weight) || 0
      const r = Number(s.reps) || 0
      totalVolume += w * r
      totalSets += 1
      byName[key].volume += w * r
      if (w > byName[key].max) byName[key].max = w
    }
  }
  const topLifts = Object.entries(byName)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
  return { sessions: strengthEx.length, totalVolume: Math.round(totalVolume), totalSets, topLifts }
})
</script>
