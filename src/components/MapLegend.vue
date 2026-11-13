<script setup lang="ts">
import { GUEST_ACCESS, SALES_POINT_COLOR } from '@/config'
</script>

<template>
  <div class="legend">
    <div v-for="(access, key) in GUEST_ACCESS" :key="key">
      <span class="swatch" :style="{ background: access.color }" />{{ access.label }}
    </div>
    <div>
      <span class="swatch is-round" :style="{ background: SALES_POINT_COLOR }" />Ausgabestelle
    </div>
  </div>
</template>

<style scoped>
.legend {
  position: absolute;
  right: 10px;
  bottom: 24px;
  z-index: 1000;
  padding: 0.5rem 0.7rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font-size: 0.8rem;
  line-height: 1.5;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 0.4rem;
  border-radius: 2px;
  vertical-align: middle;
}

.swatch.is-round {
  border-radius: 50%;
}
</style>
