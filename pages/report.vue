<template>
  <div class="flex flex-col gap-4">
    <!-- Controls (hidden on print) -->
    <div class="no-print flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">Informe</h1>
        <button class="btn-primary" @click="print">🖨 Imprimir / PDF</button>
      </div>

      <div class="card-base flex flex-col gap-3">
        <p class="section-label !mb-0">Rango de fechas</p>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="r in PRESETS"
            :key="r.days"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            :class="
              preset === r.days
                ? 'bg-green text-bg border-green'
                : 'bg-surface text-muted border-border hover:text-green hover:border-green/40'
            "
            @click="applyPreset(r.days)"
          >{{ r.label }}</button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="r-from" class="text-[11px] text-muted mb-1 block">Desde</label>
            <input id="r-from" v-model="from" class="input-base" type="date" />
          </div>
          <div>
            <label for="r-to" class="text-[11px] text-muted mb-1 block">Hasta</label>
            <input id="r-to" v-model="to" class="input-base" type="date" />
          </div>
        </div>
        <p class="text-[11px] text-muted">
          {{ dates.length }} días · {{ rangeMeals.length }} comidas · {{ rangeExercises.length }} ejercicios · {{ rangeBody.length }} reg. corporales
        </p>
      </div>
    </div>

    <!-- Printable report -->
    <div class="report-root flex flex-col gap-5">
      <!-- Header -->
      <div class="border-b border-border pb-3">
        <p class="font-mono font-semibold text-lg">
          <span class="text-green">HEALTH</span><span class="text-muted">_LOG</span>
        </p>
        <h2 class="font-bold text-lg mt-1">
          Informe de salud — {{ profile.name || 'Usuario' }}
        </h2>
        <p class="text-xs text-muted mt-0.5">
          {{ formatDate(from) }} → {{ formatDate(to) }} · Generado {{ generatedAt }}
        </p>
      </div>

      <!-- Profile -->
      <section>
        <p class="section-label">Perfil</p>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-muted">Nombre: </span>{{ profile.name || '–' }}</div>
          <div><span class="text-muted">Edad / Sexo: </span>{{ profile.age ?? '–' }} / {{ profile.sex || '–' }}</div>
          <div><span class="text-muted">Altura: </span>{{ profile.height ? `${profile.height} cm` : '–' }}</div>
          <div><span class="text-muted">Actividad: </span>{{ activityLabel }}</div>
          <div><span class="text-muted">Meta kcal: </span>{{ profile.goalCalories ?? '–' }}</div>
          <div><span class="text-muted">Meta proteína: </span>{{ profile.goalProtein ? `${profile.goalProtein}g` : '–' }}</div>
          <div><span class="text-muted">Meta sueño: </span>{{ profile.goalSleep ? `${profile.goalSleep}h` : '–' }}</div>
          <div><span class="text-muted">Meta agua: </span>{{ profile.goalWater ? `${profile.goalWater}ml` : '–' }}</div>
          <div class="col-span-2"><span class="text-muted">Objetivo: </span>{{ profile.goal || '–' }}</div>
        </div>
      </section>

      <!-- Week-vs-previous deltas -->
      <section v-if="weekDelta">
        <p class="section-label">Semana actual vs. semana anterior</p>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div
            v-for="d in weekDelta"
            :key="d.label"
            class="card-base !p-2 flex items-baseline justify-between"
          >
            <span class="text-muted text-xs">{{ d.label }}</span>
            <span class="flex items-baseline gap-1.5">
              <span class="font-mono font-semibold">{{ d.current }}</span>
              <span v-if="d.delta !== null" class="font-mono text-[11px]" :class="d.deltaClass">
                ({{ d.delta > 0 ? '+' : '' }}{{ d.delta }})
              </span>
            </span>
          </div>
        </div>
      </section>

      <!-- KPIs -->
      <section>
        <p class="section-label">Métricas medias del rango</p>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div class="card-base">
            <div class="font-mono font-semibold text-lg text-green">{{ avg.calIn }}</div>
            <div class="text-[10px] text-muted mt-0.5">kcal/día</div>
          </div>
          <div class="card-base">
            <div class="font-mono font-semibold text-lg text-red">{{ avg.calOut }}</div>
            <div class="text-[10px] text-muted mt-0.5">kcal quemadas/día</div>
          </div>
          <div class="card-base">
            <div class="font-mono font-semibold text-lg text-blue">{{ avg.protein }}g</div>
            <div class="text-[10px] text-muted mt-0.5">proteína/día</div>
          </div>
          <div class="card-base">
            <div class="font-mono font-semibold text-lg" :class="avg.net >= 0 ? 'text-orange' : 'text-blue'">
              {{ avg.net >= 0 ? '+' : '' }}{{ avg.net }}
            </div>
            <div class="text-[10px] text-muted mt-0.5">balance/día</div>
          </div>
        </div>
      </section>

      <!-- Body snapshot -->
      <section v-if="bodyAgg">
        <p class="section-label">Cuerpo</p>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="card-base">
            <div class="text-[10px] text-muted">Peso medio</div>
            <div class="font-mono font-semibold text-base">{{ bodyAgg.weight.avg ?? '–' }} kg</div>
            <div v-if="bodyAgg.weight.delta !== null" class="text-[11px] text-muted mt-1">
              Δ {{ bodyAgg.weight.delta > 0 ? '+' : '' }}{{ bodyAgg.weight.delta }} kg
            </div>
          </div>
          <div class="card-base">
            <div class="text-[10px] text-muted">Sueño medio</div>
            <div class="font-mono font-semibold text-base">{{ bodyAgg.sleep.avg ?? '–' }} h</div>
            <div class="text-[11px] text-muted mt-1">{{ bodyAgg.sleep.count }} noches</div>
          </div>
          <div v-if="bmiNow" class="card-base">
            <div class="text-[10px] text-muted">IMC actual</div>
            <div class="font-mono font-semibold text-base">{{ bmiNow.value }}</div>
            <div class="text-[11px] text-muted mt-1">{{ bmiNow.label }}</div>
          </div>
        </div>
      </section>

      <!-- Daily meal breakdown -->
      <section v-if="dailyBreakdown.length">
        <p class="section-label">Desglose diario de comidas</p>
        <p class="text-[11px] text-muted mb-3">
          Cada día muestra las comidas agrupadas por tipo, totales del día y % respecto a tu meta.
        </p>
        <div class="flex flex-col gap-3">
          <div
            v-for="day in dailyBreakdown"
            :key="day.date"
            class="card-base !p-3 flex flex-col gap-2"
          >
            <div class="flex items-baseline justify-between border-b border-border pb-2 mb-1">
              <p class="font-semibold">{{ formatDate(day.date) }}</p>
              <p class="text-[11px] text-muted font-mono">
                <span class="text-green">{{ day.totals.calories }} kcal</span>
                <span v-if="goalCal" class="text-muted"> / {{ goalCal }}</span>
                <span v-if="goalCal" class="ml-1" :class="day.pct > 105 ? 'text-red' : day.pct > 90 ? 'text-green' : 'text-orange'">
                  ({{ day.pct }}%)
                </span>
              </p>
            </div>

            <div class="flex gap-3 text-[11px] font-mono flex-wrap">
              <span class="text-blue">P {{ day.totals.protein }}g</span>
              <span class="text-orange">C {{ day.totals.carbs }}g</span>
              <span class="text-purple">G {{ day.totals.fat }}g</span>
              <span v-if="day.water" class="text-blue">💧 {{ day.water }}ml</span>
            </div>

            <div
              v-for="group in day.groups"
              :key="group.type"
              class="flex flex-col gap-1 mt-1"
            >
              <p class="text-[11px] text-muted uppercase tracking-wide">{{ group.type }}</p>
              <div
                v-for="meal in group.meals"
                :key="meal.id"
                class="pl-2 border-l-2 border-border py-1"
              >
                <p class="text-sm">
                  {{ meal.name }}
                  <span v-if="meal.portionGrams" class="text-muted text-xs">· {{ meal.portionGrams }}g</span>
                </p>
                <p class="text-[11px] font-mono text-muted">
                  <span v-if="meal.calories" class="text-green">{{ meal.calories }}kcal</span>
                  <span v-if="meal.protein" class="text-blue ml-1.5">P{{ meal.protein }}</span>
                  <span v-if="meal.carbs" class="text-orange ml-1.5">C{{ meal.carbs }}</span>
                  <span v-if="meal.fat" class="text-purple ml-1.5">G{{ meal.fat }}</span>
                </p>
                <p v-if="meal.notes" class="text-[11px] text-muted italic mt-0.5">
                  ✎ {{ meal.notes }}
                </p>
              </div>
            </div>

            <div v-if="day.exercises.length" class="mt-2 border-t border-border pt-2">
              <p class="text-[11px] text-muted uppercase tracking-wide">Ejercicio</p>
              <div
                v-for="ex in day.exercises"
                :key="ex.id"
                class="pl-2 border-l-2 border-border py-1"
              >
                <p class="text-sm">
                  <span class="text-muted text-xs">[{{ ex.category }}]</span>
                  {{ ex.name }}
                </p>
                <p class="text-[11px] font-mono text-muted">{{ detailOf(ex) }} · Int. {{ ex.intensity }}/5</p>
                <p v-if="ex.notes" class="text-[11px] text-muted italic mt-0.5">✎ {{ ex.notes }}</p>
              </div>
            </div>

            <div v-if="day.bodyEntry" class="mt-2 border-t border-border pt-2">
              <p class="text-[11px] text-muted uppercase tracking-wide">Cuerpo</p>
              <div class="pl-2 border-l-2 border-border py-1">
                <p class="text-[11px] font-mono text-muted">
                  <span v-if="day.bodyEntry.weight" class="text-green">{{ day.bodyEntry.weight }}kg</span>
                  <span v-if="day.bodyEntry.sleepHours" class="text-blue ml-1.5">{{ day.bodyEntry.sleepHours }}h sueño</span>
                  <span v-if="day.bodyEntry.sleepQuality" class="text-muted ml-1.5">Calidad {{ day.bodyEntry.sleepQuality }}/5</span>
                </p>
                <p v-if="day.bodyEntry.notes" class="text-[11px] text-muted italic mt-0.5">✎ {{ day.bodyEntry.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Exercise by category summary -->
      <section v-if="topCategories.length">
        <p class="section-label">Ejercicio por categoría (agregado)</p>
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-1.5 font-medium text-muted text-xs">Categoría</th>
              <th class="text-right py-1.5 font-medium text-muted text-xs">Sesiones</th>
              <th class="text-right py-1.5 font-medium text-muted text-xs">Minutos</th>
              <th class="text-right py-1.5 font-medium text-muted text-xs">Kcal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in topCategories" :key="cat.name" class="border-b border-border/50">
              <td class="py-1.5">{{ cat.name }}</td>
              <td class="text-right py-1.5 font-mono">{{ cat.count }}</td>
              <td class="text-right py-1.5 font-mono">{{ cat.minutes }}</td>
              <td class="text-right py-1.5 font-mono">{{ cat.kcal }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p class="text-[10px] text-muted text-center pt-3 border-t border-border">
        Generado con HealthLog · {{ generatedAt }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { todayStr, daysBetween, formatDate, lastNDays } from '~/utils/dates'
import { calcBMI, bmiCategory, pct } from '~/utils/calculations'
import { ACTIVITY_LABELS } from '~/utils/nutrition'
import type { Exercise, Meal, MealType, ActivityLevel } from '~/types'

const store = useAppStore()
const profile = computed(() => store.profile)

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
]

const preset = ref<number | null>(30)
const to = ref(todayStr())
const from = ref(computeFrom(30))

function computeFrom(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const applyPreset = (days: number) => {
  preset.value = days
  to.value = todayStr()
  from.value = computeFrom(days)
}

watch([from, to], () => {
  preset.value = null
})

const dates = computed(() => (from.value && to.value ? daysBetween(from.value, to.value) : []))
const dateSet = computed(() => new Set(dates.value))

const rangeMeals = computed(() =>
  [...store.meals].filter((m) => dateSet.value.has(m.date)).sort((a, b) => a.date.localeCompare(b.date)),
)
const rangeExercises = computed(() =>
  [...store.exercises].filter((e) => dateSet.value.has(e.date)).sort((a, b) => a.date.localeCompare(b.date)),
)
const rangeBody = computed(() =>
  [...store.body].filter((b) => dateSet.value.has(b.date)).sort((a, b) => a.date.localeCompare(b.date)),
)

const round = (n: number) => Math.round(n)
const goalCal = computed(() => Number(profile.value.goalCalories) || 0)

const avg = computed(() => {
  const n = dates.value.length || 1
  const sum = (arr: Record<string, any>[], field: string) =>
    arr.reduce((s, x) => s + (Number(x[field]) || 0), 0)
  const calIn = round(sum(rangeMeals.value, 'calories') / n)
  const calOut = round(sum(rangeExercises.value, 'caloriesBurned') / n)
  const protein = round(sum(rangeMeals.value, 'protein') / n)
  return { calIn, calOut, protein, net: calIn - calOut }
})

const bodyAgg = computed(() => {
  if (!rangeBody.value.length) return null
  const weights = rangeBody.value.map((e) => e.weight).filter((w): w is number => w != null)
  const sleeps = rangeBody.value.map((e) => e.sleepHours).filter((s): s is number => s != null)
  const avgW = weights.length ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null
  const avgS = sleeps.length ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : null
  const delta =
    weights.length >= 2 ? +(weights[weights.length - 1] - weights[0]).toFixed(1) : null
  return {
    weight: { avg: avgW, delta },
    sleep: { avg: avgS, count: sleeps.length },
  }
})

const bmiNow = computed(() => {
  const lb = store.latestBody
  if (!lb?.weight || !profile.value.height) return null
  const v = Number(calcBMI(Number(lb.weight), Number(profile.value.height)))
  return { value: v, label: bmiCategory(v).label }
})

const topCategories = computed(() => {
  const map: Record<string, { count: number; minutes: number; kcal: number }> = {}
  for (const ex of rangeExercises.value) {
    if (!map[ex.category]) map[ex.category] = { count: 0, minutes: 0, kcal: 0 }
    map[ex.category].count += 1
    map[ex.category].minutes += Number(ex.duration) || 0
    map[ex.category].kcal += Number(ex.caloriesBurned) || 0
  }
  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
})

const MEAL_ORDER: MealType[] = [
  'Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', 'Pre-entreno', 'Post-entreno',
]

const dailyBreakdown = computed(() => {
  const out = []
  for (const date of dates.value) {
    const meals = rangeMeals.value.filter((m) => m.date === date)
    const exercises = rangeExercises.value.filter((e) => e.date === date)
    const bodyEntries = rangeBody.value.filter((b) => b.date === date)
    const waterEntries = store.water.filter((w) => w.date === date)
    if (!meals.length && !exercises.length && !bodyEntries.length) continue

    const totals = {
      calories: round(meals.reduce((s, m) => s + (Number(m.calories) || 0), 0)),
      protein: round(meals.reduce((s, m) => s + (Number(m.protein) || 0), 0)),
      carbs: round(meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0)),
      fat: round(meals.reduce((s, m) => s + (Number(m.fat) || 0), 0)),
    }
    const groups: { type: MealType; meals: Meal[] }[] = []
    for (const type of MEAL_ORDER) {
      const list = meals.filter((m) => m.mealType === type)
      if (list.length) groups.push({ type, meals: list })
    }
    out.push({
      date,
      totals,
      pct: pct(totals.calories, goalCal.value),
      groups,
      exercises,
      bodyEntry: bodyEntries[bodyEntries.length - 1] ?? null,
      water: waterEntries.reduce((s, w) => s + w.amount, 0),
    })
  }
  return out
})

const detailOf = (ex: Exercise): string => {
  if (ex.category === 'Fuerza' && ex.sets?.length) {
    return ex.sets.map((s) => `${s.weight ?? '–'}kg×${s.reps ?? '–'}`).join(' · ')
  }
  if (ex.category === 'Pasos') {
    const parts: string[] = []
    if (ex.steps) parts.push(`${ex.steps.toLocaleString('es-ES')} pasos`)
    if (ex.distance) parts.push(`${ex.distance} km`)
    if (ex.caloriesBurned) parts.push(`${ex.caloriesBurned} kcal`)
    return parts.join(' · ') || '–'
  }
  const parts: string[] = []
  if (ex.duration) parts.push(`${ex.duration} min`)
  if (ex.caloriesBurned) parts.push(`${ex.caloriesBurned} kcal`)
  return parts.join(' · ') || '–'
}

const activityLabel = computed(() => {
  const a = profile.value.activity as ActivityLevel
  return a && a !== '' ? ACTIVITY_LABELS[a] : '–'
})

// Week vs previous
const weekDelta = computed(() => {
  const cur = lastNDays(7)
  const prev = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d)
      x.setDate(x.getDate() - (6 - i))
      return x.toISOString().split('T')[0]
    })
  })()
  const avgOf = (arr: string[], field: 'calIn' | 'calOut' | 'protein' | 'water') => {
    const n = arr.length || 1
    return round(
      arr.reduce((s, date) => s + (store.statsForDate(date)[field] as number), 0) / n,
    )
  }
  const items = [
    { label: 'Kcal/día', field: 'calIn' as const, invert: false },
    { label: 'Kcal quemadas/día', field: 'calOut' as const, invert: false },
    { label: 'Proteína/día (g)', field: 'protein' as const, invert: false },
    { label: 'Agua/día (ml)', field: 'water' as const, invert: false },
  ]
  const out = items.map((it) => {
    const current = avgOf(cur, it.field)
    const previous = avgOf(prev, it.field)
    const delta = previous === 0 ? null : current - previous
    const deltaClass =
      delta === null
        ? 'text-muted'
        : delta > 0
          ? 'text-green'
          : delta < 0
            ? 'text-red'
            : 'text-muted'
    return { ...it, current, previous, delta, deltaClass }
  })
  return out.some((x) => x.previous > 0) ? out : null
})

const generatedAt = computed(() =>
  new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
)

const print = () => window.print()
</script>
