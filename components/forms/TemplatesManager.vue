<template>
  <div class="flex flex-col gap-3.5">
    <h2 class="text-base font-bold">Plantillas de comidas 📋</h2>
    <p class="text-[11px] text-muted">
      Un toque y se añaden todas las comidas de la plantilla a hoy.
    </p>

    <!-- Templates list -->
    <div v-if="store.templates.length" class="flex flex-col gap-2">
      <div
        v-for="tpl in store.templates"
        :key="tpl.id"
        class="card-base !p-3 flex flex-col gap-2"
      >
        <div class="flex items-baseline justify-between gap-2">
          <p class="font-medium truncate">{{ tpl.name }}</p>
          <p class="text-[11px] text-muted font-mono shrink-0">
            {{ tpl.items.length }} ítems · {{ totalKcal(tpl) }} kcal
          </p>
        </div>
        <div class="flex flex-wrap gap-1.5 text-[11px] text-muted">
          <span v-for="(it, i) in tpl.items" :key="i" class="tag">
            {{ it.mealType }} · {{ it.name }}
          </span>
        </div>
        <div class="flex gap-2 mt-1">
          <button class="btn-ghost flex-1" @click="askDelete(tpl.id)">Borrar</button>
          <button class="btn-primary flex-[2]" @click="apply(tpl.id)">Aplicar a hoy</button>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-muted text-sm py-4">
      <p>Aún no has creado ninguna plantilla.</p>
    </div>

    <!-- Save today as template -->
    <div
      v-if="todayCount > 0"
      class="card-base !p-3 flex flex-col gap-2 border-green/30"
    >
      <p class="text-[11px] text-muted">
        Guarda las <span class="text-green">{{ todayCount }}</span> comidas de hoy como plantilla:
      </p>
      <div class="flex gap-2">
        <input
          v-model="newName"
          class="input-base flex-1"
          placeholder="Nombre (ej: Desayuno típico)"
        />
        <button
          class="btn-primary shrink-0"
          :disabled="!newName.trim()"
          @click="saveToday"
        >Guardar</button>
      </div>
    </div>
    <p v-else class="text-[11px] text-muted italic">
      Cuando tengas comidas registradas hoy, aquí podrás guardarlas como plantilla.
    </p>

    <div class="flex gap-2.5 mt-1">
      <button class="btn-ghost flex-1" @click="$emit('close')">Cerrar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { todayStr } from '~/utils/dates'
import type { MealTemplate } from '~/types'

const emit = defineEmits<{ close: [] }>()
const store = useAppStore()
const toast = useToast()

const newName = ref('')
const todayCount = computed(() => store.meals.filter((m) => m.date === todayStr()).length)

const totalKcal = (tpl: MealTemplate) =>
  tpl.items.reduce((s, it) => s + (Number(it.calories) || 0), 0)

const apply = (id: string) => {
  const n = store.applyTemplate(id)
  if (n) toast.push(`${n} comida${n === 1 ? '' : 's'} añadida${n === 1 ? '' : 's'}`, { variant: 'success' })
  emit('close')
}

const askDelete = (id: string) => {
  if (!confirm('¿Borrar esta plantilla?')) return
  store.deleteTemplate(id)
  toast.push('Plantilla borrada', { variant: 'info' })
}

const saveToday = () => {
  const tpl = store.saveTodayAsTemplate(newName.value)
  if (tpl) {
    toast.push(`Plantilla «${tpl.name}» guardada`, { variant: 'success' })
    newName.value = ''
  }
}
</script>
