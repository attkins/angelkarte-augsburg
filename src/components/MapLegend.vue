<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { GUEST_ACCESS } from '@/config'

defineProps<{ embedded?: boolean }>()
</script>

<template>
  <div class="legend" :class="{ glass: !embedded, 'is-embedded': embedded }">
    <div class="legend-title">Gastzugang</div>
    <div v-for="(access, key) in GUEST_ACCESS" :key="key" class="legend-row">
      <span
        class="swatch"
        :class="{ 'is-dashed': access.token === 'unknown' }"
        :style="{ '--swatch': `var(--${access.token})` }"
      />
      <AppIcon :name="access.icon" :size="15" :stroke-width="2.2" :style="{ color: `var(--${access.token}-text)` }" />
      {{ access.label }}
    </div>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 16px;
  border-radius: 16px;
  font-size: 13px;
}

.legend.is-embedded {
  padding: 0;
}

.legend-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-2);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.swatch {
  width: 22px;
  height: 14px;
  border-radius: 4px;
  background: var(--swatch);
}

.swatch.is-dashed {
  background: none;
  border: 1px dashed var(--swatch);
}
</style>
