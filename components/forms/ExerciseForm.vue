<template>
  <div class="flex flex-col gap-3.5">
    <h2 class="text-base font-bold">{{ editing ? 'Editar Ejercicio' : 'Nuevo Ejercicio' }} 💪</h2>

    <div>
      <label for="ex-cat" class="text-[11px] text-muted mb-1 block">Categoría</label>
      <select id="ex-cat" v-model="form.category" class="input-base">
        <option v-for="c in EX_CATS" :key="c">{{ c }}</option>
      </select>
    </div>

    <div>
      <label for="ex-name" class="text-[11px] text-muted mb-1 block">Nombre *</label>
      <input
        id="ex-name"
        v-model="form.name"
        class="input-base"
        placeholder="ej: Correr, Press banca..."
      />
    </div>

    <!-- History hint -->
    <div v-if="history.length" class="card-base !p-3 flex flex-col gap-1.5">
      <p class="text-[11px] text-muted">Últimas sesiones de «{{ form.name }}»</p>
      <div
        v-for="h in history"
        :key="h.id"
        class="flex justify-between items-start gap-2 text-xs"
      >
        <div class="flex-1 min-w-0">
          <p class="text-muted font-mono">{{ h.date }}</p>
          <p v-if="h.sets?.length" class="font-mono text-[11px] text-text truncate">
            {{ setsSummary(h.sets) }}
          </p>
          <p v-else class="font-mono text-[11px] text-text truncate">
            <span v-if="h.duration" class="text-orange">{{ h.duration }} min</span>
            <span v-if="h.caloriesBurned" class="text-red ml-1">· {{ h.caloriesBurned }} kcal</span>
          </p>
        </div>
        <button
          v-if="h.sets?.length"
          type="button"
          class="text-green text-[11px] font-semibold uppercase hover:underline shrink-0"
          @click="repeatFrom(h)"
        >
          Repetir
        </button>
      </div>
      <p v-if="prMax !== null" class="text-[11px] font-mono text-green mt-1">
        🏆 PR: {{ prMax }} kg
      </p>
    </div>

    <!-- Strength: sets repeater -->
    <div v-if="isStrength" class="flex flex-col gap-2">
      <p class="text-[11px] text-muted">Series</p>
      <div
        v-for="(set, i) in form.sets"
        :key="i"
        class="flex items-center gap-2"
      >
        <input
          v-model.number="set.weight"
          class="input-base flex-1"
          type="number"
          step="0.5"
          min="0"
          placeholder="Peso (kg)"
          :aria-label="`Peso serie ${i + 1}`"
        />
        <span class="text-muted text-xs" aria-hidden="true">×</span>
        <input
          v-model.number="set.reps"
          class="input-base flex-1"
          type="number"
          min="0"
          placeholder="Reps"
          :aria-label="`Repeticiones serie ${i + 1}`"
        />
        <button
          type="button"
          class="del-btn shrink-0"
          :disabled="form.sets.length === 1"
          :aria-label="`Borrar serie ${i + 1}`"
          @click="removeSet(i)"
        >×</button>
      </div>
      <button type="button" class="btn-ghost" @click="addSet">+ Añadir serie</button>
      <p v-if="currentVolume > 0" class="text-[11px] text-muted font-mono">
        Volumen total: <span class="text-green">{{ currentVolume }} kg</span>
      </p>
    </div>

    <!-- Steps -->
    <div v-else-if="isSteps" class="flex flex-col gap-2.5">
      <div>
        <label for="ex-steps" class="text-[11px] text-muted mb-1 block">Pasos</label>
        <input id="ex-steps" v-model.number="form.steps" class="input-base" type="number" min="0" step="100" placeholder="ej: 8500" />
      </div>
      <div class="grid grid-cols-2 gap-2.5">
        <div>
          <label for="ex-dist" class="text-[11px] text-muted mb-1 block">Distancia (km)</label>
          <input id="ex-dist" v-model.number="form.distance" class="input-base" type="number" min="0" step="0.1" placeholder="ej: 5.4" />
        </div>
        <div>
          <label for="ex-kcal" class="text-[11px] text-muted mb-1 block">Kcal quemadas</label>
          <input id="ex-kcal" v-model.number="form.caloriesBurned" class="input-base" type="number" min="0" placeholder="kcal" />
        </div>
      </div>
      <div v-if="form.steps && form.steps > 0" class="flex flex-col gap-1 text-[11px] text-muted">
        <button
          v-if="!form.caloriesBurned && suggestedStepsKcal > 0"
          type="button"
          class="text-left hover:text-green transition-colors"
          @click="form.caloriesBurned = suggestedStepsKcal"
        >
          💡 Kcal estimadas: <span class="text-green font-mono">{{ suggestedStepsKcal }}</span>
          {{ latestWeight ? `(${latestWeight} kg)` : '(peso 70 kg estimado)' }} · tocar para aplicar
        </button>
        <button
          v-if="!form.distance && suggestedStepsDistance > 0"
          type="button"
          class="text-left hover:text-green transition-colors"
          @click="form.distance = suggestedStepsDistance"
        >
          💡 Distancia estimada: <span class="text-green font-mono">{{ suggestedStepsDistance }} km</span> (0.70 m/paso) · tocar para aplicar
        </button>
      </div>
    </div>

    <!-- Cardio-like: duration + kcal -->
    <div v-else class="grid grid-cols-2 gap-2.5">
      <div>
        <label for="ex-dur" class="text-[11px] text-muted mb-1 block">Duración (min)</label>
        <input id="ex-dur" v-model.number="form.duration" class="input-base" type="number" min="0" placeholder="min" />
      </div>
      <div>
        <label for="ex-kcal" class="text-[11px] text-muted mb-1 block">Kcal quemadas</label>
        <input id="ex-kcal" v-model.number="form.caloriesBurned" class="input-base" type="number" min="0" placeholder="kcal" />
      </div>
    </div>

    <div>
      <p class="text-[11px] text-muted mb-2">Intensidad</p>
      <div class="flex gap-2" role="radiogroup" aria-label="Intensidad">
        <button
          v-for="n in [1, 2, 3, 4, 5]"
          :key="n"
          role="radio"
          :aria-checked="form.intensity === n"
          class="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-200"
          :class="
            form.intensity === n
              ? 'bg-green text-bg border-green'
              : 'bg-surface text-muted border-border'
          "
          @click="form.intensity = n as 1|2|3|4|5"
        >
          {{ n }}
        </button>
      </div>
      <p class="text-[11px] text-muted mt-1.5 text-center">{{ intensityLabel(form.intensity) }}</p>
    </div>

    <div>
      <label for="ex-date" class="text-[11px] text-muted mb-1 block">Fecha</label>
      <input id="ex-date" v-model="form.date" class="input-base" type="date" />
    </div>
    <div>
      <label for="ex-notes" class="text-[11px] text-muted mb-1 block">Notas</label>
      <textarea id="ex-notes" v-model="form.notes" class="input-base resize-none" rows="2" placeholder="Opcional" />
    </div>

    <div class="flex gap-2.5 mt-1">
      <button class="btn-ghost flex-1" @click="$emit('cancel')">Cancelar</button>
      <button class="btn-primary flex-[2]" :disabled="!form.name" @click="submit">Guardar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { todayStr } from '~/utils/dates'
import { intensityLabel } from '~/utils/calculations'
import type { Exercise, ExerciseCategory, ExerciseSet } from '~/types'

const EX_CATS: ExerciseCategory[] = [
  'Cardio', 'Fuerza', 'HIIT', 'Flexibilidad',
  'Deportes', 'Caminata', 'Pasos', 'Natación', 'Yoga', 'Ciclismo', 'Otro',
]

const props = defineProps<{ initial?: Exercise }>()
const emit = defineEmits<{ cancel: []; saved: [] }>()
const store = useAppStore()

const editing = computed(() => !!props.initial)
const emptySet = (): ExerciseSet => ({ weight: null, reps: null })

const form = reactive({
  category: (props.initial?.category ?? 'Cardio') as ExerciseCategory,
  name: props.initial?.name ?? '',
  duration: props.initial?.duration ?? (null as number | null),
  intensity: (props.initial?.intensity ?? 3) as 1 | 2 | 3 | 4 | 5,
  caloriesBurned: props.initial?.caloriesBurned ?? (null as number | null),
  sets: (props.initial?.sets && props.initial.sets.length
    ? props.initial.sets.map((s) => ({ ...s }))
    : [emptySet()]) as ExerciseSet[],
  steps: props.initial?.steps ?? (null as number | null),
  distance: props.initial?.distance ?? (null as number | null),
  date: props.initial?.date ?? todayStr(),
  notes: props.initial?.notes ?? '',
})

const isStrength = computed(() => form.category === 'Fuerza')
const isSteps = computed(() => form.category === 'Pasos')

const latestWeight = computed(() => Number(store.latestBody?.weight) || 0)
const suggestedStepsKcal = computed(() => {
  const s = Number(form.steps) || 0
  if (s <= 0) return 0
  const w = latestWeight.value || 70
  return Math.round(s * w * 0.00045)
})
const suggestedStepsDistance = computed(() => {
  const s = Number(form.steps) || 0
  if (s <= 0) return 0
  return Math.round(s * 0.0007 * 100) / 100
})

const addSet = () => form.sets.push(emptySet())
const removeSet = (i: number) => {
  if (form.sets.length > 1) form.sets.splice(i, 1)
}

const currentVolume = computed(() =>
  form.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
)

const history = computed(() => {
  const q = form.name.trim().toLowerCase()
  if (q.length < 2) return []
  return [...store.exercises]
    .filter(
      (e) =>
        e.name.trim().toLowerCase() === q &&
        (!props.initial || e.id !== props.initial.id),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
})

const prMax = computed(() => {
  const q = form.name.trim().toLowerCase()
  if (!q) return null
  let max = 0
  for (const ex of store.exercises) {
    if (ex.name.trim().toLowerCase() !== q || !ex.sets) continue
    for (const s of ex.sets) {
      if (s.weight != null && s.weight > max) max = s.weight
    }
  }
  return max > 0 ? max : null
})

const setsSummary = (sets: ExerciseSet[]): string =>
  sets.map((s) => `${s.weight ?? '–'}×${s.reps ?? '–'}`).join(' · ')

const repeatFrom = (h: Exercise) => {
  if (!h.sets?.length) return
  form.category = h.category
  form.sets = h.sets.map((s) => ({ ...s }))
}

const submit = () => {
  if (!form.name.trim()) return
  const { sets, duration, caloriesBurned, steps, distance, ...rest } = form
  let payload
  if (isStrength.value) {
    const cleanSets = sets
      .filter((s) => s.weight != null || s.reps != null)
      .map((s) => ({ weight: s.weight, reps: s.reps }))
    payload = {
      ...rest,
      duration: null,
      caloriesBurned: null,
      sets: cleanSets.length ? cleanSets : null,
      steps: null,
      distance: null,
    }
  } else if (isSteps.value) {
    payload = {
      ...rest,
      duration: null,
      caloriesBurned,
      sets: null,
      steps,
      distance,
    }
  } else {
    payload = { ...rest, duration, caloriesBurned, sets: null, steps: null, distance: null }
  }

  if (props.initial) {
    store.updateExercise(props.initial.id, payload)
  } else {
    store.addExercise(payload)
  }
  emit('saved')
}
</script>
