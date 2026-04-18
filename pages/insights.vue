<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Insights</h1>
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
        >{{ r.label }}</button>
      </div>
    </div>

    <p class="text-[11px] text-muted -mt-1">
      Relaciones entre tus variables en los últimos {{ rangeDays }} días.
      Coef. de Pearson (r): va de -1 a 1. Cuanto más cerca de ±1, más relación.
    </p>

    <div v-if="!correlations.length" class="card-base text-center py-8 text-muted">
      <p class="text-3xl mb-2">📉</p>
      <p>Necesitas al menos 3 días con datos en el rango</p>
      <p class="text-xs mt-1">para poder calcular correlaciones.</p>
    </div>

    <div
      v-for="c in correlations"
      :key="c.key"
      class="card-base flex flex-col gap-2"
    >
      <div class="flex items-baseline justify-between gap-2">
        <div>
          <p class="text-sm font-semibold">{{ c.title }}</p>
          <p class="text-[11px] text-muted">{{ c.description }}</p>
        </div>
        <div class="text-right">
          <p class="font-mono font-semibold text-base" :class="c.interp.colorClass">
            r = {{ c.r.toFixed(2) }}
          </p>
          <p class="text-[10px] text-muted">{{ c.n }} días</p>
        </div>
      </div>
      <p class="text-[11px]" :class="c.interp.colorClass">{{ c.interp.label }}</p>
      <ScatterChart
        :points="c.points"
        :x-label="c.xLabel"
        :y-label="c.yLabel"
        :color="c.color"
      />
      <p v-if="c.takeaway" class="text-[11px] text-muted italic border-t border-border pt-2">
        💡 {{ c.takeaway }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { lastNDays } from '~/utils/dates'
import { pearson, interpretPearson } from '~/utils/correlations'
import { sumField } from '~/utils/calculations'

const store = useAppStore()

const RANGES = [
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
]
const rangeDays = ref(60)

interface DayMetrics {
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  water: number
  steps: number
  exerciseMin: number
  exerciseKcal: number
  weight: number | null
  sleep: number | null
  sleepQuality: number | null
}

const dates = computed(() => lastNDays(rangeDays.value))

const daily = computed<DayMetrics[]>(() =>
  dates.value.map((date) => {
    const dm = store.meals.filter((m) => m.date === date)
    const de = store.exercises.filter((e) => e.date === date)
    const dw = store.water.filter((w) => w.date === date)
    const bodyEntries = store.body.filter((b) => b.date === date)
    const db = bodyEntries.length ? bodyEntries[bodyEntries.length - 1] : null
    const steps = de
      .filter((e) => e.category === 'Pasos')
      .reduce((s, e) => s + (Number(e.steps) || 0), 0)
    return {
      date,
      kcal: sumField(dm, 'calories'),
      protein: sumField(dm, 'protein'),
      carbs: sumField(dm, 'carbs'),
      fat: sumField(dm, 'fat'),
      water: dw.reduce((s, w) => s + w.amount, 0),
      steps,
      exerciseMin: sumField(de, 'duration'),
      exerciseKcal: sumField(de, 'caloriesBurned'),
      weight: db?.weight ?? null,
      sleep: db?.sleepHours ?? null,
      sleepQuality: db?.sleepQuality ?? null,
    }
  }),
)

interface Pair {
  key: string
  title: string
  description: string
  xLabel: string
  yLabel: string
  color?: string
  xs: number[]
  ys: number[]
  takeaway?: (r: number) => string
}

const collectPair = (xSel: (d: DayMetrics) => number | null, ySel: (d: DayMetrics) => number | null) => {
  const xs: number[] = []
  const ys: number[] = []
  for (const d of daily.value) {
    const x = xSel(d)
    const y = ySel(d)
    if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) continue
    if (x === 0 && y === 0) continue
    xs.push(x)
    ys.push(y)
  }
  return { xs, ys }
}

const correlations = computed(() => {
  const pairs: Pair[] = [
    {
      key: 'sleep-vs-kcal',
      title: 'Sueño ↔ Kcal del día',
      description: '¿Comes más los días que duermes peor?',
      xLabel: 'Horas sueño',
      yLabel: 'Kcal',
      color: '#4f9eff',
      ...collectPair((d) => d.sleep, (d) => d.kcal > 0 ? d.kcal : null),
      takeaway: (r) =>
        r < -0.3
          ? 'Sueles comer más cuando duermes menos. El descanso influye en el apetito.'
          : r > 0.3
            ? 'Comes más los días que duermes más. Podría ser sesgo de fin de semana.'
            : 'El sueño no parece influir en tus calorías en este rango.',
    },
    {
      key: 'protein-vs-weight',
      title: 'Proteína ↔ Peso',
      description: '¿Tu peso evoluciona con la ingesta de proteína?',
      xLabel: 'g proteína/día',
      yLabel: 'Peso (kg)',
      color: '#7fff6e',
      ...collectPair((d) => d.protein > 0 ? d.protein : null, (d) => d.weight),
    },
    {
      key: 'steps-vs-weight',
      title: 'Pasos ↔ Peso',
      description: '¿Más pasos se reflejan en tu peso?',
      xLabel: 'Pasos',
      yLabel: 'Peso (kg)',
      color: '#ffb347',
      ...collectPair((d) => d.steps > 0 ? d.steps : null, (d) => d.weight),
    },
    {
      key: 'kcal-vs-weight',
      title: 'Kcal ↔ Peso',
      description: '¿Días con más kcal correlacionan con subida?',
      xLabel: 'Kcal',
      yLabel: 'Peso (kg)',
      color: '#ff6b6b',
      ...collectPair((d) => d.kcal > 0 ? d.kcal : null, (d) => d.weight),
    },
    {
      key: 'exercise-vs-sleep',
      title: 'Ejercicio ↔ Calidad sueño',
      description: '¿Duermes mejor los días que entrenas más?',
      xLabel: 'Min ejercicio',
      yLabel: 'Calidad sueño',
      color: '#b97fff',
      ...collectPair((d) => d.exerciseMin > 0 ? d.exerciseMin : null, (d) => d.sleepQuality),
    },
    {
      key: 'water-vs-weight',
      title: 'Agua ↔ Peso',
      description: '¿La hidratación se nota en tu peso?',
      xLabel: 'Agua (ml)',
      yLabel: 'Peso (kg)',
      color: '#4f9eff',
      ...collectPair((d) => d.water > 0 ? d.water : null, (d) => d.weight),
    },
  ]

  return pairs
    .map((p) => {
      const r = pearson(p.xs, p.ys)
      if (r === null) return null
      return {
        ...p,
        r,
        n: p.xs.length,
        points: p.xs.map((x, i) => ({ x, y: p.ys[i] })),
        interp: interpretPearson(r),
        takeaway: p.takeaway?.(r),
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
})
</script>
