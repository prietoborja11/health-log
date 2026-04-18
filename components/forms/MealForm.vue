<template>
  <div class="flex flex-col gap-3.5">
    <h2 class="text-base font-bold">{{ editing ? 'Editar Comida' : 'Nueva Comida' }} 🍽</h2>

    <div>
      <label for="meal-type" class="text-[11px] text-muted mb-1 block">Tipo de comida</label>
      <select id="meal-type" v-model="form.mealType" class="input-base">
        <option v-for="t in MEAL_TYPES" :key="t">{{ t }}</option>
      </select>
    </div>

    <!-- Name + OFF search + barcode -->
    <div class="flex flex-col gap-2">
      <label for="meal-name" class="text-[11px] text-muted block">Nombre del alimento o plato *</label>
      <div class="flex gap-2">
        <input
          id="meal-name"
          v-model="form.name"
          class="input-base flex-1"
          placeholder="ej: Avena con plátano"
          @keydown.enter.prevent="runSearch"
        />
        <button
          type="button"
          class="btn-ghost shrink-0"
          :disabled="food.loading.value || !form.name.trim()"
          :aria-label="food.loading.value ? 'Buscando' : 'Buscar en OpenFoodFacts'"
          @click="runSearch"
        >{{ food.loading.value ? '…' : '🔍' }}</button>
        <button
          v-if="barcodeSupported"
          type="button"
          class="btn-ghost shrink-0"
          aria-label="Escanear código de barras"
          @click="startScanner"
        >📷</button>
      </div>

      <!-- Scanner -->
      <div v-if="scanning" class="card-base flex flex-col gap-2 !p-2">
        <video ref="scanVideoEl" class="w-full rounded-md bg-black" autoplay muted playsinline />
        <p v-if="scanner.error.value" class="text-xs text-red">{{ scanner.error.value }}</p>
        <p v-else class="text-[11px] text-muted">Apunta al código de barras</p>
        <button type="button" class="btn-ghost" @click="stopScanner">Cancelar</button>
      </div>

      <!-- Search results -->
      <div
        v-if="food.results.value.length || food.error.value"
        class="card-base flex flex-col gap-1.5 max-h-64 overflow-y-auto !p-2"
      >
        <p v-if="food.error.value" class="text-xs text-red px-2 py-1">
          {{ food.error.value }}
        </p>
        <button
          v-for="(r, i) in food.results.value"
          :key="i"
          type="button"
          class="text-left px-2 py-1.5 rounded hover:bg-border transition-colors"
          @click="applyResult(r)"
        >
          <p class="text-sm truncate flex items-center gap-2">
            <span
              v-if="r.nutriScore"
              class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase"
              :style="{ background: nutriScoreColor[r.nutriScore.toLowerCase()] || '#666' }"
              :aria-label="`Nutri-Score ${r.nutriScore}`"
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
          <p v-if="r.nova" class="text-[10px] text-muted mt-0.5">{{ novaLabel(r.nova) }}</p>
        </button>
      </div>

      <!-- Portion scaler -->
      <div v-if="per100" class="card-base flex flex-col gap-2 !p-3">
        <p class="text-[11px] text-muted">
          Valores por 100g de «{{ per100.name }}». Ajusta la porción para escalar:
        </p>
        <div class="flex items-center gap-2">
          <input
            v-model.number="form.portionGrams"
            class="input-base flex-1"
            type="number"
            min="0"
            step="5"
            aria-label="Porción en gramos"
            @input="applyPortion"
          />
          <span class="text-muted text-xs">g</span>
          <button type="button" class="btn-ghost" @click="clearPortion">Quitar</button>
        </div>
      </div>
    </div>

    <!-- Recents -->
    <div v-if="!editing && recentNames.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="name in recentNames"
        :key="name"
        type="button"
        class="tag cursor-pointer hover:text-green hover:bg-border transition-colors"
        @click="prefillFromRecent(name)"
      >{{ name }}</button>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <label for="meal-cal" class="text-[11px] text-muted mb-1 block">Calorías (kcal)</label>
        <input id="meal-cal" v-model.number="form.calories" class="input-base" type="number" min="0" placeholder="kcal" />
      </div>
      <div>
        <label for="meal-prot" class="text-[11px] text-muted mb-1 block">Proteína (g)</label>
        <input id="meal-prot" v-model.number="form.protein" class="input-base" type="number" min="0" step="0.1" placeholder="g" />
      </div>
      <div>
        <label for="meal-carbs" class="text-[11px] text-muted mb-1 block">Carbohidratos (g)</label>
        <input id="meal-carbs" v-model.number="form.carbs" class="input-base" type="number" min="0" step="0.1" placeholder="g" />
      </div>
      <div>
        <label for="meal-fat" class="text-[11px] text-muted mb-1 block">Grasas (g)</label>
        <input id="meal-fat" v-model.number="form.fat" class="input-base" type="number" min="0" step="0.1" placeholder="g" />
      </div>
    </div>

    <button
      v-if="showKcalSuggestion"
      type="button"
      class="text-xs text-muted text-left hover:text-green transition-colors -mt-1"
      @click="form.calories = suggestedKcal"
    >
      💡 Kcal estimadas desde macros: <span class="text-green font-mono">{{ suggestedKcal }} kcal</span> · tocar para aplicar
    </button>

    <!-- Photo -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <button type="button" class="btn-ghost flex-1" @click="photoInput?.click()">
          📸 {{ photoPreview ? 'Cambiar foto' : 'Añadir foto' }}
        </button>
        <button v-if="photoPreview" type="button" class="btn-ghost" @click="removePhoto">Quitar</button>
      </div>
      <input
        ref="photoInput"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="onPhotoChange"
      />
      <img
        v-if="photoPreview"
        :src="photoPreview"
        alt="Foto de la comida"
        class="rounded-lg max-h-48 object-cover w-full border border-border"
      />
    </div>

    <div>
      <label for="meal-date" class="text-[11px] text-muted mb-1 block">Fecha</label>
      <input id="meal-date" v-model="form.date" class="input-base" type="date" />
    </div>
    <div>
      <label for="meal-notes" class="text-[11px] text-muted mb-1 block">Notas</label>
      <textarea id="meal-notes" v-model="form.notes" class="input-base resize-none" rows="2" placeholder="Opcional" />
    </div>

    <div class="flex gap-2.5 mt-1">
      <button class="btn-ghost flex-1" @click="cancel">Cancelar</button>
      <button class="btn-primary flex-[2]" :disabled="!form.name" @click="submit">Guardar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useFoodSearch, type FoodResult } from '~/composables/useFoodSearch'
import { useBarcodeScanner, isBarcodeSupported } from '~/composables/useBarcodeScanner'
import { usePhotoStore } from '~/composables/usePhotoStore'
import { todayStr } from '~/utils/dates'
import { scaleMacrosByGrams, nutriScoreColor, novaLabel } from '~/utils/nutrition'
import { uid } from '~/utils/calculations'
import type { Meal, MealType } from '~/types'

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', 'Pre-entreno', 'Post-entreno']

const props = defineProps<{ initial?: Meal }>()
const emit = defineEmits<{ cancel: []; saved: [] }>()
const store = useAppStore()
const food = useFoodSearch()
const scanner = useBarcodeScanner()
const photoStore = usePhotoStore()

const barcodeSupported = isBarcodeSupported()
const editing = computed(() => !!props.initial)

const form = reactive({
  mealType: (props.initial?.mealType ?? 'Desayuno') as MealType,
  name: props.initial?.name ?? '',
  calories: props.initial?.calories ?? (null as number | null),
  protein: props.initial?.protein ?? (null as number | null),
  carbs: props.initial?.carbs ?? (null as number | null),
  fat: props.initial?.fat ?? (null as number | null),
  portionGrams: props.initial?.portionGrams ?? (null as number | null),
  photoId: props.initial?.photoId ?? (null as string | null),
  date: props.initial?.date ?? todayStr(),
  notes: props.initial?.notes ?? '',
})

const per100 = ref<FoodResult | null>(null)

const photoPreview = ref<string | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const photoFile = ref<File | null>(null)
const photoDirty = ref(false)

onMounted(async () => {
  if (form.photoId) {
    photoPreview.value = await photoStore.load(form.photoId)
  }
})

const suggestedKcal = computed(() => {
  const p = Number(form.protein) || 0
  const c = Number(form.carbs) || 0
  const f = Number(form.fat) || 0
  return Math.round(p * 4 + c * 4 + f * 9)
})

const showKcalSuggestion = computed(
  () => (form.calories == null || form.calories === 0) && suggestedKcal.value > 0,
)

const recentNames = computed(() => {
  const seen = new Set<string>()
  const names: string[] = []
  for (const m of [...store.meals].reverse()) {
    const key = m.name.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    names.push(m.name)
    if (names.length >= 6) break
  }
  return names
})

const prefillFromRecent = (name: string) => {
  const last = [...store.meals].reverse().find((m) => m.name === name)
  if (!last) return
  form.name = last.name
  form.calories = last.calories
  form.protein = last.protein
  form.carbs = last.carbs
  form.fat = last.fat
  form.portionGrams = last.portionGrams
  per100.value = null
}

const runSearch = () => food.search(form.name)

const applyResult = (r: FoodResult) => {
  form.name = r.name
  per100.value = r
  const grams = r.defaultServingG ?? 100
  form.portionGrams = grams
  applyPortion()
  food.reset()
}

const applyPortion = () => {
  if (!per100.value) return
  const grams = Number(form.portionGrams) || 0
  if (grams <= 0) return
  const scaled = scaleMacrosByGrams(per100.value, grams)
  form.calories = scaled.calories
  form.protein = scaled.protein
  form.carbs = scaled.carbs
  form.fat = scaled.fat
}

const clearPortion = () => {
  per100.value = null
  form.portionGrams = null
}

const scanVideoEl = ref<HTMLVideoElement | null>(null)
const scanning = ref(false)

const startScanner = async () => {
  scanning.value = true
  await nextTick()
  if (!scanVideoEl.value) return
  await scanner.start(scanVideoEl.value, async (code) => {
    const r = await food.getByBarcode(code)
    scanner.stop()
    scanning.value = false
    if (r) applyResult(r)
  })
}
const stopScanner = () => {
  scanner.stop()
  scanning.value = false
}

const onPhotoChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoFile.value = file
  photoDirty.value = true
  photoPreview.value = URL.createObjectURL(file)
}

const removePhoto = () => {
  photoPreview.value = null
  photoFile.value = null
  photoDirty.value = true
  form.photoId = null
  if (photoInput.value) photoInput.value.value = ''
}

const cancel = () => {
  stopScanner()
  emit('cancel')
}

const persistPhoto = async () => {
  if (!photoDirty.value) return
  if (props.initial?.photoId && props.initial.photoId !== form.photoId) {
    await photoStore.remove(props.initial.photoId)
  }
  if (photoFile.value) {
    const id = form.photoId || uid()
    try {
      await photoStore.save(id, photoFile.value)
      form.photoId = id
    } catch {
      form.photoId = null
    }
  }
}

const submit = async () => {
  if (!form.name.trim()) return
  stopScanner()
  await persistPhoto()
  const { ...payload } = form
  if (props.initial) store.updateMeal(props.initial.id, payload)
  else store.addMeal(payload)
  emit('saved')
}

onBeforeUnmount(() => stopScanner())
</script>
