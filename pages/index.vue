<template>
  <div class="flex flex-col gap-4">
    <!-- Greeting -->
    <div>
      <h1 class="text-xl font-bold">Hola, {{ store.profile.name || 'Amigo' }} 👋</h1>
      <p class="text-xs text-muted mt-1">{{ todayLong() }}</p>
    </div>

    <!-- Streak + Perfect day -->
    <StreakCard :streak="streak" :status="perfect" />

    <!-- Reminder -->
    <div
      v-if="showReminder"
      class="card-base border-orange/40 flex items-center gap-3 text-sm"
    >
      <span class="text-xl">⏰</span>
      <div class="flex-1">
        <p>No has registrado nada hoy.</p>
        <p class="text-[11px] text-muted">Toca "+ Comida" o registra agua para empezar.</p>
      </div>
    </div>

    <!-- Calorie balance -->
    <div class="card-base">
      <p class="section-label">Balance calórico de hoy</p>
      <div class="grid grid-cols-3 gap-2 text-center mb-4">
        <div v-for="stat in balanceStats" :key="stat.label">
          <div class="font-mono font-semibold text-xl" :class="stat.colorClass">{{ stat.value }}</div>
          <div class="text-[10px] text-muted mt-0.5">{{ stat.label }}</div>
        </div>
      </div>
      <div v-if="store.profile.goalCalories">
        <div class="flex justify-between text-[11px] text-muted mb-1.5">
          <span>Meta: {{ store.profile.goalCalories }} kcal</span>
          <span class="font-mono text-green">{{ calGoalPct }}%</span>
        </div>
        <div class="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="calGoalPct > 100 ? 'bg-red' : 'bg-green'"
            :style="{ width: `${calGoalPct}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Macros -->
    <div class="card-base flex flex-col gap-3">
      <p class="section-label">Macros de hoy</p>
      <ProgressBar
        label="Proteína"
        :value="store.todayProtein"
        :goal="store.profile.goalProtein ?? undefined"
        unit="g"
        color-class="text-blue"
        bar-class="bg-blue"
      />
      <ProgressBar
        label="Carbohidratos"
        :value="store.todayCarbs"
        unit="g"
        color-class="text-orange"
        bar-class="bg-orange"
      />
      <ProgressBar
        label="Grasas"
        :value="store.todayFat"
        unit="g"
        color-class="text-purple"
        bar-class="bg-purple"
      />
    </div>

    <!-- Water -->
    <div class="card-base flex flex-col gap-3">
      <div class="flex items-baseline justify-between">
        <p class="section-label !mb-0">Agua de hoy</p>
        <span class="font-mono text-sm">
          <span class="text-blue">{{ store.todayWater }}</span>
          <span class="text-muted text-xs">
            / {{ store.profile.goalWater ?? '–' }} ml
          </span>
        </span>
      </div>
      <div v-if="store.profile.goalWater" class="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          class="h-full bg-blue rounded-full transition-all duration-700"
          :style="{ width: `${waterPct}%` }"
        />
      </div>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="amt in [200, 250, 330, 500]"
          :key="amt"
          class="btn-ghost !py-1.5 text-xs"
          @click="addWater(amt)"
        >+{{ amt }}</button>
      </div>
    </div>

    <!-- Body snapshot -->
    <div v-if="store.latestBody" class="grid grid-cols-2 gap-2.5">
      <StatCard
        label="Peso"
        :value="store.latestBody.weight"
        unit="kg"
        color-class="text-green"
        :sub="bmiLine"
      />
      <StatCard
        label="Sueño"
        :value="store.latestBody.sleepHours"
        unit="h"
        color-class="text-blue"
        :sub="store.latestBody.sleepQuality ? `Calidad: ${store.latestBody.sleepQuality}/5` : null"
      />
    </div>

    <!-- 7-day chart -->
    <CaloriesChart
      :labels="store.weekStats.map((d) => d.label)"
      :cal-in="store.weekStats.map((d) => d.calIn)"
      :cal-out="store.weekStats.map((d) => d.calOut)"
      title="Últimos 7 días — calorías"
    />

    <!-- Quick add -->
    <div>
      <p class="section-label">Registro rápido</p>
      <div class="grid grid-cols-3 gap-2.5">
        <button
          v-for="btn in quickBtns"
          :key="btn.modal"
          class="card-base flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-colors duration-200 hover:border-green/40"
          @click="activeModal = btn.modal"
        >
          <span class="text-2xl">{{ btn.icon }}</span>
          <span class="text-xs font-medium" :class="btn.colorClass">{{ btn.label }}</span>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <Modal v-if="activeModal === 'meal'" @close="activeModal = null">
      <MealForm @saved="activeModal = null" @cancel="activeModal = null" />
    </Modal>
    <Modal v-if="activeModal === 'exercise'" @close="activeModal = null">
      <ExerciseForm @saved="activeModal = null" @cancel="activeModal = null" />
    </Modal>
    <Modal v-if="activeModal === 'body'" @close="activeModal = null">
      <BodyForm @saved="activeModal = null" @cancel="activeModal = null" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { todayLong, todayStr } from '~/utils/dates'
import { calcBMI, bmiCategory, pct } from '~/utils/calculations'
import { loggingStreak, perfectDayStatus } from '~/utils/streak'

const store = useAppStore()
const toast = useToast()
const activeModal = ref<'meal' | 'exercise' | 'body' | null>(null)

const calGoalPct = computed(() =>
  pct(store.todayCalIn, Number(store.profile.goalCalories) || 0),
)

const waterPct = computed(() =>
  pct(store.todayWater, Number(store.profile.goalWater) || 0),
)

const addWater = (amount: number) => {
  store.addWater(amount)
  toast.push(`+${amount} ml de agua`, { variant: 'success', duration: 2500 })
}

const hasDataByDate = (date: string) => {
  if (store.meals.some((m) => m.date === date)) return true
  if (store.exercises.some((e) => e.date === date)) return true
  if (store.body.some((b) => b.date === date)) return true
  if (store.water.some((w) => w.date === date)) return true
  return false
}

const streak = computed(() => loggingStreak(hasDataByDate))
const todayStats = computed(() => store.statsForDate(todayStr()))
const perfect = computed(() =>
  perfectDayStatus(todayStats.value, store.profile, store.todayExercises.length),
)

const showReminder = computed(() => {
  if (hasDataByDate(todayStr())) return false
  const hour = new Date().getHours()
  return hour >= 12
})

const netColor = computed(() => {
  const n = store.todayNet
  if (n > 300) return 'text-orange'
  if (n < -300) return 'text-blue'
  return 'text-green'
})

const balanceStats = computed(() => [
  { label: 'Consumido', value: store.todayCalIn, colorClass: 'text-green' },
  { label: 'Quemado', value: store.todayCalOut, colorClass: 'text-red' },
  { label: 'Neto', value: store.todayNet, colorClass: netColor.value },
])

const bmiLine = computed(() => {
  const lb = store.latestBody
  if (!lb?.weight || !store.profile.height) return null
  const bmi = Number(calcBMI(Number(lb.weight), Number(store.profile.height)))
  return `IMC: ${bmi} · ${bmiCategory(bmi).label}`
})

const quickBtns = [
  { modal: 'meal' as const, icon: '🍽', label: '+ Comida', colorClass: 'text-green' },
  { modal: 'exercise' as const, icon: '💪', label: '+ Ejercicio', colorClass: 'text-red' },
  { modal: 'body' as const, icon: '📏', label: '+ Cuerpo', colorClass: 'text-blue' },
]
</script>
