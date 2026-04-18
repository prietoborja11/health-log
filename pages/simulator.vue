<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-xl font-bold">Simulador</h1>
      <p class="text-xs text-muted mt-1">
        ¿Qué pasa si me como esto? Comparamos tu día antes y después.
      </p>
    </div>

    <!-- Search -->
    <div class="card-base flex flex-col gap-2">
      <label for="sim-q" class="text-[11px] text-muted">Buscar alimento</label>
      <div class="flex gap-2">
        <input
          id="sim-q"
          v-model="query"
          class="input-base flex-1"
          placeholder="ej: Plátano, pan, yogur..."
          @keydown.enter.prevent="food.search(query)"
        />
        <button
          type="button"
          class="btn-ghost shrink-0"
          :disabled="food.loading.value || !query.trim()"
          @click="food.search(query)"
        >{{ food.loading.value ? '…' : '🔍' }}</button>
      </div>
      <div
        v-if="food.results.value.length || food.error.value"
        class="flex flex-col gap-1 max-h-64 overflow-y-auto -mx-1"
      >
        <p v-if="food.error.value" class="text-xs text-red px-2 py-1">{{ food.error.value }}</p>
        <button
          v-for="(r, i) in food.results.value"
          :key="i"
          type="button"
          class="text-left px-2 py-1.5 rounded hover:bg-border transition-colors"
          @click="pick(r)"
        >
          <p class="text-sm truncate flex items-center gap-2">
            <span
              v-if="r.nutriScore"
              class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase"
              :style="{ background: nutriScoreColor[r.nutriScore.toLowerCase()] || '#666' }"
            >{{ r.nutriScore }}</span>
            <span class="truncate">{{ r.name }}</span>
            <span v-if="r.brand" class="text-muted text-xs truncate">· {{ r.brand }}</span>
          </p>
          <p class="text-[11px] text-muted font-mono mt-0.5">
            <span v-if="r.calories != null" class="text-green">{{ r.calories }}kcal</span>
            <span v-if="r.protein != null" class="text-blue ml-1.5">P{{ r.protein }}</span>
            <span v-if="r.carbs != null" class="text-orange ml-1.5">C{{ r.carbs }}</span>
            <span v-if="r.fat != null" class="text-purple ml-1.5">G{{ r.fat }}</span>
            <span class="text-muted ml-1.5">/ 100g</span>
          </p>
        </button>
      </div>
    </div>

    <!-- Selected -->
    <div v-if="selected" class="card-base flex flex-col gap-3">
      <div class="flex items-start gap-2">
        <p class="font-medium flex-1 min-w-0 truncate">{{ selected.name }}</p>
        <button type="button" class="del-btn" @click="selected = null">×</button>
      </div>
      <div>
        <label for="sim-g" class="text-[11px] text-muted mb-1 block">Porción (g)</label>
        <input id="sim-g" v-model.number="grams" class="input-base" type="number" min="0" step="5" />
      </div>
      <div class="grid grid-cols-4 gap-2 text-center">
        <div>
          <div class="font-mono font-semibold text-sm text-green">{{ added.calories ?? 0 }}</div>
          <div class="text-[10px] text-muted">kcal</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-sm text-blue">{{ added.protein ?? 0 }}</div>
          <div class="text-[10px] text-muted">P (g)</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-sm text-orange">{{ added.carbs ?? 0 }}</div>
          <div class="text-[10px] text-muted">C (g)</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-sm text-purple">{{ added.fat ?? 0 }}</div>
          <div class="text-[10px] text-muted">G (g)</div>
        </div>
      </div>
    </div>

    <!-- Before / After -->
    <div class="card-base flex flex-col gap-3">
      <p class="section-label !mb-0">Tu día</p>
      <div
        v-for="row in comparisonRows"
        :key="row.key"
        class="flex items-center gap-3"
      >
        <span class="text-xs text-muted w-20 shrink-0">{{ row.label }}</span>
        <span class="font-mono text-xs text-muted w-14 text-right">{{ row.before }}</span>
        <span class="text-muted text-xs">→</span>
        <span class="font-mono text-xs w-14 text-right" :class="row.colorClass">{{ row.after }}</span>
        <span v-if="row.goal" class="text-[10px] text-muted ml-1 w-12 text-right">/ {{ row.goal }}</span>
        <div class="flex-1 h-1.5 bg-border rounded-full overflow-hidden ml-1">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="row.barClass"
            :style="{ width: `${row.pct}%` }"
          />
        </div>
      </div>
      <div v-if="warning" class="text-xs text-orange border-t border-border pt-2 mt-1">
        ⚠ {{ warning }}
      </div>
    </div>

    <!-- Add as meal -->
    <button
      v-if="selected && grams > 0"
      class="btn-primary"
      @click="addAsMeal"
    >+ Registrarlo como comida</button>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useFoodSearch, type FoodResult } from '~/composables/useFoodSearch'
import { useToast } from '~/composables/useToast'
import { scaleMacrosByGrams, nutriScoreColor } from '~/utils/nutrition'
import { pct } from '~/utils/calculations'
import { todayStr } from '~/utils/dates'

const store = useAppStore()
const food = useFoodSearch()
const toast = useToast()

const query = ref('')
const selected = ref<FoodResult | null>(null)
const grams = ref(100)

const pick = (r: FoodResult) => {
  selected.value = r
  grams.value = r.defaultServingG ?? 100
  food.reset()
  query.value = ''
}

const added = computed(() => {
  if (!selected.value || !grams.value) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  return scaleMacrosByGrams(selected.value, grams.value)
})

const comparisonRows = computed(() => {
  const gCal = Number(store.profile.goalCalories) || 0
  const gProt = Number(store.profile.goalProtein) || 0
  const before = {
    calories: store.todayCalIn,
    protein: store.todayProtein,
    carbs: store.todayCarbs,
    fat: store.todayFat,
  }
  const after = {
    calories: before.calories + (added.value.calories ?? 0),
    protein: Math.round(before.protein + (added.value.protein ?? 0)),
    carbs: Math.round(before.carbs + (added.value.carbs ?? 0)),
    fat: Math.round(before.fat + (added.value.fat ?? 0)),
  }
  return [
    {
      key: 'kcal',
      label: 'Kcal',
      before: before.calories,
      after: after.calories,
      goal: gCal || null,
      pct: pct(after.calories, gCal),
      colorClass: after.calories > gCal && gCal ? 'text-red' : 'text-green',
      barClass: after.calories > gCal && gCal ? 'bg-red' : 'bg-green',
    },
    {
      key: 'prot',
      label: 'Proteína',
      before: before.protein,
      after: after.protein,
      goal: gProt || null,
      pct: pct(after.protein, gProt),
      colorClass: 'text-blue',
      barClass: 'bg-blue',
    },
    {
      key: 'carbs',
      label: 'Carbos',
      before: before.carbs,
      after: after.carbs,
      goal: null,
      pct: 0,
      colorClass: 'text-orange',
      barClass: 'bg-orange',
    },
    {
      key: 'fat',
      label: 'Grasa',
      before: before.fat,
      after: after.fat,
      goal: null,
      pct: 0,
      colorClass: 'text-purple',
      barClass: 'bg-purple',
    },
  ]
})

const warning = computed(() => {
  const gCal = Number(store.profile.goalCalories) || 0
  if (!gCal) return null
  const after = store.todayCalIn + (added.value.calories ?? 0)
  if (after > gCal * 1.1) {
    const over = after - gCal
    return `Te pasarías ${over} kcal de tu meta (${Math.round((after / gCal) * 100)}%).`
  }
  return null
})

const addAsMeal = () => {
  if (!selected.value) return
  store.addMeal({
    mealType: 'Snack',
    name: selected.value.name,
    calories: added.value.calories,
    protein: added.value.protein,
    carbs: added.value.carbs,
    fat: added.value.fat,
    portionGrams: grams.value,
    photoId: null,
    date: todayStr(),
    notes: '',
  })
  toast.push(`«${selected.value.name}» añadida a tus comidas`, { variant: 'success' })
  selected.value = null
  grams.value = 100
}
</script>
