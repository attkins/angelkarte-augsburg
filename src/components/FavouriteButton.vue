<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useFavourites } from '@/composables/useFavourites'

const props = defineProps<{ waterId: string; name: string }>()

const { isFavourite, toggle } = useFavourites()
const active = computed(() => isFavourite(props.waterId))
</script>

<template>
  <button
    type="button"
    class="icon-button favourite-button"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    :aria-label="`${name} merken`"
    :title="active ? 'Gemerkt, unter „Meine Gewässer“' : 'Merken'"
    @click="toggle(waterId)"
  >
    <AppIcon :name="active ? 'star-filled' : 'star'" :size="18" />
  </button>
</template>

<style scoped>
.favourite-button {
  flex: 0 0 44px;
  margin-top: -4px;
  border: 0;
  background: var(--surface-3);
  color: var(--text-2);
}

.favourite-button:hover {
  color: var(--text);
}

.favourite-button.is-active {
  color: var(--accent);
}
</style>
