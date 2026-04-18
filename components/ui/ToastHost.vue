<template>
  <Teleport to="body">
    <div class="fixed bottom-20 left-0 right-0 z-[150] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <div
        v-for="t in toast.toasts.value"
        :key="t.id"
        class="pointer-events-auto bg-card border rounded-lg px-4 py-2.5 text-sm flex items-center gap-3 shadow-lg max-w-md w-full"
        :class="{
          'border-border': t.variant === 'info',
          'border-green/40': t.variant === 'success',
          'border-red/40': t.variant === 'error',
        }"
      >
        <span class="flex-1">{{ t.message }}</span>
        <button
          v-if="t.action"
          class="text-green text-xs font-semibold uppercase tracking-wide hover:underline"
          @click="runAction(t)"
        >
          {{ t.action.label }}
        </button>
        <button
          class="text-muted text-lg leading-none hover:text-text"
          aria-label="Cerrar notificación"
          @click="toast.dismiss(t.id)"
        >
          ×
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast, type Toast } from '~/composables/useToast'

const toast = useToast()

const runAction = (t: Toast) => {
  t.action?.run()
  toast.dismiss(t.id)
}
</script>
