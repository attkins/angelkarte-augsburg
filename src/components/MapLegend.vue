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
    <div class="legend-title is-second">Beim gewählten Gewässer</div>
    <div class="legend-row">
      <span class="place-pin is-parking legend-place"><AppIcon name="parking" :size="13" :stroke-width="2.4" /></span>
      Parkplatz
    </div>
    <div class="legend-row">
      <span class="place-pin is-access legend-place"><AppIcon name="access" :size="13" :stroke-width="2.4" /></span>
      Zugang
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

.legend-title.is-second {
  margin-top: 4px;
}

/* Same look as on the map, a little smaller and without shadow. */
.legend-place {
  width: 22px;
  height: 22px;
  box-shadow: none;
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
