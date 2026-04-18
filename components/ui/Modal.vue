<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/80 z-[200] flex items-end justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="bg-card border border-border rounded-t-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
        style="padding-bottom: max(24px, env(safe-area-inset-bottom))"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineEmits<{ close: [] }>()
</script>
