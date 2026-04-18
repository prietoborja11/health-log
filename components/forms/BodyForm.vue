<template>
  <div class="flex flex-col gap-3.5">
    <h2 class="text-base font-bold">{{ editing ? 'Editar Registro' : 'Parámetros Corporales' }} 📏</h2>

    <div class="grid grid-cols-2 gap-2.5">
      <div v-for="field in measureFields" :key="field.key">
        <label :for="`body-${field.key}`" class="text-[11px] text-muted mb-1 block">{{ field.label }}</label>
        <input
          :id="`body-${field.key}`"
          v-model.number="(form as any)[field.key]"
          class="input-base"
          type="number"
          min="0"
          :step="field.step ?? 1"
          :placeholder="field.placeholder"
        />
        <p v-if="field.key === 'weight' && liveIMC" class="text-[11px] text-green mt-1 font-mono">
          IMC: {{ liveIMC }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <label for="body-sleep-h" class="text-[11px] text-muted mb-1 block">Horas de sueño</label>
        <input id="body-sleep-h" v-model.number="form.sleepHours" class="input-base" type="number" step="0.5" min="0" placeholder="ej: 7.5" />
      </div>
      <div>
        <label for="body-sleep-q" class="text-[11px] text-muted mb-1 block">Calidad del sueño</label>
        <select id="body-sleep-q" v-model.number="form.sleepQuality" class="input-base">
          <option v-for="(label, i) in SLEEP_LABELS" :key="i" :value="i + 1">{{ label }}</option>
        </select>
      </div>
    </div>

    <div>
      <label for="body-date" class="text-[11px] text-muted mb-1 block">Fecha</label>
      <input id="body-date" v-model="form.date" class="input-base" type="date" />
    </div>
    <div>
      <label for="body-notes" class="text-[11px] text-muted mb-1 block">Notas</label>
      <textarea id="body-notes" v-model="form.notes" class="input-base resize-none" rows="2" placeholder="Opcional" />
    </div>

    <div class="flex gap-2.5 mt-1">
      <button class="btn-ghost flex-1" @click="$emit('cancel')">Cancelar</button>
      <button class="btn-primary flex-[2]" @click="submit">Guardar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { todayStr } from '~/utils/dates'
import { calcBMI } from '~/utils/calculations'
import type { BodyEntry } from '~/types'

const props = defineProps<{ initial?: BodyEntry }>()
const emit = defineEmits<{ cancel: []; saved: [] }>()
const store = useAppStore()

const editing = computed(() => !!props.initial)

const SLEEP_LABELS = ['1 – Muy mala', '2 – Mala', '3 – Regular', '4 – Buena', '5 – Excelente']

const measureFields = [
  { key: 'weight', label: 'Peso (kg)', placeholder: 'ej: 72.5', step: 0.1 },
  { key: 'waist', label: 'Cintura (cm)', placeholder: 'ej: 80' },
  { key: 'hips', label: 'Cadera (cm)', placeholder: 'ej: 95' },
  { key: 'chest', label: 'Pecho (cm)', placeholder: 'ej: 100' },
  { key: 'leftArm', label: 'Brazo Izq. (cm)', placeholder: 'ej: 33' },
  { key: 'rightArm', label: 'Brazo Der. (cm)', placeholder: 'ej: 33' },
  { key: 'leftLeg', label: 'Pierna Izq. (cm)', placeholder: 'ej: 55' },
  { key: 'rightLeg', label: 'Pierna Der. (cm)', placeholder: 'ej: 55' },
]

const form = reactive({
  weight: props.initial?.weight ?? (null as number | null),
  waist: props.initial?.waist ?? (null as number | null),
  hips: props.initial?.hips ?? (null as number | null),
  chest: props.initial?.chest ?? (null as number | null),
  leftArm: props.initial?.leftArm ?? (null as number | null),
  rightArm: props.initial?.rightArm ?? (null as number | null),
  leftLeg: props.initial?.leftLeg ?? (null as number | null),
  rightLeg: props.initial?.rightLeg ?? (null as number | null),
  sleepHours: props.initial?.sleepHours ?? (null as number | null),
  sleepQuality: (props.initial?.sleepQuality ?? 3) as 1 | 2 | 3 | 4 | 5,
  date: props.initial?.date ?? todayStr(),
  notes: props.initial?.notes ?? '',
})

const liveIMC = computed(() =>
  form.weight && store.profile.height
    ? calcBMI(form.weight, Number(store.profile.height))
    : null,
)

const submit = () => {
  if (props.initial) {
    store.updateBodyEntry(props.initial.id, { ...form })
  } else {
    store.addBodyEntry({ ...form })
  }
  emit('saved')
}
</script>
