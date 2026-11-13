<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { GUEST_ACCESS } from '@/config'
import type { GuestAccess } from '@/types'

const props = defineProps<{ access: GuestAccess }>()

const info = computed(() => GUEST_ACCESS[props.access] ?? GUEST_ACCESS.unknown)
</script>

<template>
  <span
    class="access-badge"
    :style="{ background: `var(--${info.token}-bg)`, color: `var(--${info.token}-text)` }"
  >
    <AppIcon :name="info.icon" :size="15" :stroke-width="2.4" />{{ info.label }}
  </span>
</template>

<style scoped>
.access-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
