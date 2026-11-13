<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { useTheme } from '@/composables/useTheme'

defineProps<{ floating?: boolean }>()

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-button theme-toggle"
    :class="{ glass: floating }"
    :aria-label="theme === 'dark' ? 'Helles Design einschalten' : 'Dunkles Design einschalten'"
    @click="toggle"
  >
    <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
  </button>
</template>

<style scoped>
.theme-toggle:not(.glass) {
  border: 1px solid var(--border);
  background: var(--surface-2);
}
</style>
