<template>
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    class="w-14 h-14 rounded-md object-cover border border-border shrink-0"
  />
</template>

<script setup lang="ts">
import { usePhotoStore } from '~/composables/usePhotoStore'

const props = defineProps<{ photoId: string | null; alt?: string }>()

const photoStore = usePhotoStore()
const src = ref<string | null>(null)

const load = async () => {
  src.value = props.photoId ? await photoStore.load(props.photoId) : null
}

watch(() => props.photoId, load, { immediate: true })
</script>
