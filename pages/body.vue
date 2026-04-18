<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Cuerpo</h1>
      <button class="btn-primary" @click="showForm = true">+ Registrar</button>
    </div>

    <!-- Empty state -->
    <div v-if="!store.latestBody" class="card-base text-center py-12 text-muted">
      <p class="text-4xl mb-3">◎</p>
      <p class="font-medium">No hay datos corporales aún</p>
      <p class="text-sm mt-1">¡Empieza registrando tu peso!</p>
    </div>

    <template v-else>
      <!-- Weight + Sleep -->
      <div class="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Peso"
          :value="store.latestBody.weight"
          unit="kg"
          color-class="text-green"
          :sub="bmiSub"
        />
        <StatCard
          label="Sueño"
          :value="store.latestBody.sleepHours"
          unit="h"
          color-class="text-blue"
          :sub="store.latestBody.sleepQuality ? `Calidad: ${store.latestBody.sleepQuality}/5` : null"
        />
      </div>

      <!-- BMI card -->
      <div v-if="bmiVal" class="card-base flex items-center gap-4">
        <div class="font-mono font-semibold text-4xl" :class="bmiCat.tailwind">
          {{ bmiVal }}
        </div>
        <div>
          <p class="font-semibold" :class="bmiCat.tailwind">{{ bmiCat.label }}</p>
          <p class="text-xs text-muted">Índice de Masa Corporal</p>
          <p class="text-[11px] text-muted mt-0.5">Normal: 18.5 – 24.9</p>
        </div>
      </div>

      <!-- Body measures grid -->
      <div v-if="hasMeasures" class="card-base">
        <p class="section-label">Medidas corporales</p>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="m in measures" :key="m.label" class="text-center">
            <div class="font-mono font-semibold text-lg text-green">
              {{ m.value }}<span class="text-[10px] text-muted">cm</span>
            </div>
            <div class="text-[10px] text-muted mt-0.5">{{ m.label }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Weight evolution chart -->
    <WeightChart
      v-if="weightData.labels.length > 1"
      :labels="weightData.labels"
      :data="weightData.data"
      title="Evolución del peso"
      unit="kg"
    />

    <!-- Sleep chart -->
    <WeightChart
      v-if="sleepData.labels.length > 1"
      :labels="sleepData.labels"
      :data="sleepData.data"
      color="#4f9eff"
      title="Horas de sueño"
      unit="h"
    />

    <!-- History list -->
    <div v-if="store.body.length > 1">
      <p class="section-label">Historial reciente</p>
      <div
        v-for="entry in [...store.body].reverse().slice(0, 10)"
        :key="entry.id"
        v-swipe-left="() => removeBody(entry.id)"
        class="card-base mb-2 flex justify-between items-center gap-3 touch-pan-y"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs text-muted">{{ formatDate(entry.date) }}</p>
          <div class="flex flex-wrap gap-3 mt-1 text-sm font-mono">
            <span v-if="entry.weight" class="text-green">{{ entry.weight }} kg</span>
            <span v-if="entry.sleepHours" class="text-blue">{{ entry.sleepHours }}h sueño</span>
            <span v-if="entry.waist" class="text-muted text-xs">Cintura {{ entry.waist }}cm</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="edit-btn" aria-label="Editar registro" @click="editing = entry">✎</button>
          <button class="del-btn" aria-label="Borrar registro" @click="removeBody(entry.id)">×</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Modal v-if="showForm" @close="showForm = false">
      <BodyForm @saved="showForm = false" @cancel="showForm = false" />
    </Modal>
    <Modal v-if="editing" @close="editing = null">
      <BodyForm :initial="editing" @saved="editing = null" @cancel="editing = null" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { calcBMI, bmiCategory } from '~/utils/calculations'
import { dayLabel, formatDate } from '~/utils/dates'
import type { BodyEntry } from '~/types'

const store = useAppStore()
const toast = useToast()
const showForm = ref(false)
const editing = ref<BodyEntry | null>(null)

const removeBody = (id: string) => {
  const removed = store.deleteBodyEntry(id)
  if (!removed) return
  toast.push('Registro corporal borrado', {
    action: { label: 'Deshacer', run: () => store.restoreBodyEntry(removed) },
  })
}

const bmiVal = computed(() => {
  const lb = store.latestBody
  if (!lb?.weight || !store.profile.height) return null
  return Number(calcBMI(Number(lb.weight), Number(store.profile.height)))
})

const bmiCat = computed(() => bmiCategory(bmiVal.value ?? 0))

const bmiSub = computed(() =>
  bmiVal.value ? `IMC: ${bmiVal.value} · ${bmiCat.value.label}` : null,
)

const measures = computed(() => {
  const lb = store.latestBody
  if (!lb) return []
  return [
    { label: 'Cintura', value: lb.waist },
    { label: 'Cadera', value: lb.hips },
    { label: 'Pecho', value: lb.chest },
    { label: 'Brazo I.', value: lb.leftArm },
    { label: 'Brazo D.', value: lb.rightArm },
    { label: 'Pierna I.', value: lb.leftLeg },
    { label: 'Pierna D.', value: lb.rightLeg },
  ].filter((m) => m.value)
})

const hasMeasures = computed(() => measures.value.length > 0)

const weightData = computed(() => {
  const entries = store.body.filter((b) => b.weight).slice(-20)
  return {
    labels: entries.map((b) => dayLabel(b.date)),
    data: entries.map((b) => Number(b.weight)),
  }
})

const sleepData = computed(() => {
  const entries = store.body.filter((b) => b.sleepHours).slice(-14)
  return {
    labels: entries.map((b) => dayLabel(b.date)),
    data: entries.map((b) => Number(b.sleepHours)),
  }
})
</script>
