<template>
  <header
    class="bg-card border-b border-border flex items-center justify-between px-5 py-3 shrink-0 z-50"
    style="padding-top: max(12px, env(safe-area-inset-top))"
  >
    <div>
      <div class="font-mono font-semibold text-[17px] tracking-tight">
        <span class="text-green">HEALTH</span><span class="text-muted">_LOG</span>
      </div>
      <div class="text-[11px] text-muted mt-0.5">{{ todayLong() }}</div>
    </div>

    <button class="btn-ghost" @click="open = true">⚙ Perfil</button>

    <Modal v-if="open" @close="open = false">
      <ProfileForm @saved="open = false" />
    </Modal>
  </header>
</template>

<script setup lang="ts">
import { todayLong } from '~/utils/dates'

const open = ref(false)
</script>
