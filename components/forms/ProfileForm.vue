<template>
  <div class="flex flex-col gap-3.5">
    <h2 class="text-base font-bold">Mi Perfil ⚙</h2>

    <div>
      <label for="p-name" class="text-[11px] text-muted mb-1 block">Nombre</label>
      <input id="p-name" v-model="form.name" class="input-base" placeholder="Tu nombre" />
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <label for="p-height" class="text-[11px] text-muted mb-1 block">Altura (cm)</label>
        <input id="p-height" v-model.number="form.height" class="input-base" type="number" min="0" placeholder="ej: 175" />
      </div>
      <div>
        <label for="p-age" class="text-[11px] text-muted mb-1 block">Edad</label>
        <input id="p-age" v-model.number="form.age" class="input-base" type="number" min="0" placeholder="ej: 30" />
      </div>
      <div>
        <label for="p-sex" class="text-[11px] text-muted mb-1 block">Sexo</label>
        <select id="p-sex" v-model="form.sex" class="input-base">
          <option value="">Seleccionar...</option>
          <option value="M">Hombre</option>
          <option value="F">Mujer</option>
        </select>
      </div>
      <div>
        <label for="p-activity" class="text-[11px] text-muted mb-1 block">Actividad</label>
        <select id="p-activity" v-model="form.activity" class="input-base">
          <option value="">Seleccionar...</option>
          <option v-for="(label, key) in ACTIVITY_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
    </div>

    <div>
      <label for="p-goal" class="text-[11px] text-muted mb-1 block">Objetivo principal</label>
      <select id="p-goal" v-model="form.goal" class="input-base">
        <option value="">Seleccionar...</option>
        <option v-for="g in GOALS" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
    </div>

    <!-- TDEE calculator -->
    <div v-if="tdee" class="card-base !p-3 flex flex-col gap-2">
      <p class="section-label !mb-0">Calculadora de kcal</p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="font-mono font-semibold text-base text-blue">{{ tdee.bmr }}</div>
          <div class="text-[10px] text-muted mt-0.5">BMR</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-base text-orange">{{ tdee.tdee }}</div>
          <div class="text-[10px] text-muted mt-0.5">TDEE</div>
        </div>
        <div>
          <div class="font-mono font-semibold text-base text-green">{{ adjusted.target }}</div>
          <div class="text-[10px] text-muted mt-0.5">Meta</div>
        </div>
      </div>
      <p class="text-[11px] text-muted">{{ adjusted.note }}</p>
      <p v-if="suggested" class="text-[11px] text-muted font-mono">
        Macros sugeridos: <span class="text-blue">P{{ suggested.protein }}g</span>
        · <span class="text-orange">C{{ suggested.carbs }}g</span>
        · <span class="text-purple">G{{ suggested.fat }}g</span>
      </p>
      <button type="button" class="btn-ghost" @click="applyCalc">Aplicar a mis metas</button>
    </div>
    <p v-else-if="!hasAllCalcInputs" class="text-[11px] text-muted">
      Completa altura, edad, sexo, actividad y peso actual para calcular kcal automáticamente.
    </p>

    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <label for="p-kcal" class="text-[11px] text-muted mb-1 block">Meta kcal/día</label>
        <input id="p-kcal" v-model.number="form.goalCalories" class="input-base" type="number" min="0" placeholder="ej: 2000" />
      </div>
      <div>
        <label for="p-prot" class="text-[11px] text-muted mb-1 block">Meta proteína (g)</label>
        <input id="p-prot" v-model.number="form.goalProtein" class="input-base" type="number" min="0" placeholder="ej: 150" />
      </div>
      <div>
        <label for="p-sleep" class="text-[11px] text-muted mb-1 block">Meta sueño (h)</label>
        <input id="p-sleep" v-model.number="form.goalSleep" class="input-base" type="number" min="0" step="0.5" placeholder="ej: 8" />
      </div>
      <div>
        <label for="p-water" class="text-[11px] text-muted mb-1 block">Meta agua (ml)</label>
        <input id="p-water" v-model.number="form.goalWater" class="input-base" type="number" min="0" step="100" placeholder="ej: 2500" />
      </div>
    </div>

    <!-- Notifications -->
    <div class="border-t border-border pt-3 flex flex-col gap-2">
      <p class="section-label !mb-1">Recordatorios</p>
      <p class="text-[11px] text-muted">
        {{ notifSupported ? 'Te avisamos si no has registrado nada a cierta hora del día.' : 'Tu navegador no soporta notificaciones.' }}
      </p>
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          :checked="notifSettings.enabled"
          :disabled="!notifSupported"
          @change="onToggleNotif(($event.target as HTMLInputElement).checked)"
        />
        <span>Activar recordatorios</span>
      </label>
      <div v-if="notifSettings.enabled" class="flex items-center gap-2">
        <label for="p-notif-hour" class="text-[11px] text-muted">Avisar si no has registrado antes de:</label>
        <input
          id="p-notif-hour"
          type="number"
          min="0"
          max="23"
          class="input-base w-20"
          :value="notifSettings.reminderHour"
          @change="notif.setReminderHour(Number(($event.target as HTMLInputElement).value))"
        />
        <span class="text-xs text-muted">h</span>
      </div>
    </div>

    <!-- Backup / Restore -->
    <div class="border-t border-border pt-3 flex flex-col gap-2">
      <p class="section-label !mb-1">Copia de seguridad</p>
      <p class="text-[11px] text-muted">
        Guarda tus datos en un archivo JSON, o restáuralos desde una copia previa.
      </p>
      <div class="flex gap-2">
        <button type="button" class="btn-ghost flex-1" @click="exportData">⬇ Exportar JSON</button>
        <button type="button" class="btn-ghost flex-1" @click="fileInput?.click()">⬆ Importar JSON</button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        class="hidden"
        @change="onFileChange"
      />
      <p v-if="msg" class="text-[11px] font-mono" :class="msgOk ? 'text-green' : 'text-red'">
        {{ msg }}
      </p>
    </div>

    <div class="flex gap-2.5 mt-1">
      <button class="btn-ghost flex-1" @click="$emit('saved')">Cancelar</button>
      <button class="btn-primary flex-[2]" @click="submit">Guardar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useNotifications, isNotifSupported } from '~/composables/useNotifications'
import {
  mifflinStJeor,
  goalKcalAdjustment,
  suggestMacros,
  ACTIVITY_LABELS,
} from '~/utils/nutrition'

const emit = defineEmits<{ saved: [] }>()
const store = useAppStore()
const notif = useNotifications()
const notifSettings = notif.settings
const notifSupported = isNotifSupported()

const onToggleNotif = async (on: boolean) => {
  await notif.setEnabled(on)
}

const GOALS = [
  { value: 'perder peso', label: 'Perder peso' },
  { value: 'ganar músculo', label: 'Ganar músculo' },
  { value: 'mantener peso', label: 'Mantener peso' },
  { value: 'mejorar resistencia', label: 'Mejorar resistencia' },
  { value: 'mejorar salud general', label: 'Mejorar salud general' },
]

const form = reactive({ ...store.profile })
const fileInput = ref<HTMLInputElement | null>(null)
const msg = ref('')
const msgOk = ref(true)

const latestWeight = computed(() => Number(store.latestBody?.weight) || 0)

const hasAllCalcInputs = computed(
  () =>
    !!Number(form.height) &&
    !!Number(form.age) &&
    !!form.sex &&
    !!form.activity &&
    latestWeight.value > 0,
)

const tdee = computed(() => {
  if (!hasAllCalcInputs.value) return null
  return mifflinStJeor({
    weightKg: latestWeight.value,
    heightCm: Number(form.height),
    age: Number(form.age),
    sex: form.sex,
    activity: form.activity,
  })
})

const adjusted = computed(() =>
  tdee.value ? goalKcalAdjustment(tdee.value.tdee, form.goal) : { target: 0, note: '' },
)

const suggested = computed(() =>
  tdee.value && latestWeight.value
    ? suggestMacros(adjusted.value.target, latestWeight.value, form.goal)
    : null,
)

const applyCalc = () => {
  if (!tdee.value || !suggested.value) return
  form.goalCalories = adjusted.value.target
  form.goalProtein = suggested.value.protein
  flash('Metas actualizadas ✓', true)
}

const flash = (text: string, ok: boolean) => {
  msg.value = text
  msgOk.value = ok
  setTimeout(() => (msg.value = ''), 4000)
}

const exportData = () => {
  const data = store.exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `health-log-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  flash('Exportado ✓', true)
}

const onFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('Importar sobrescribirá tus datos actuales. ¿Continuar?')) {
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    const res = store.importAll(json)
    if (res.ok) {
      const d = res.imported
      flash(
        d
          ? `Importado: ${d.meals} comidas, ${d.exercises} ejercicios, ${d.body} cuerpo, ${d.water} agua${d.dropped ? ` · ${d.dropped} descartado(s)` : ''}`
          : 'Importado ✓',
        true,
      )
    } else flash(`Error: ${res.error}`, false)
  } catch {
    flash('JSON inválido', false)
  }
  if (fileInput.value) fileInput.value.value = ''
}

const submit = () => {
  store.updateProfile({ ...form })
  emit('saved')
}
</script>
