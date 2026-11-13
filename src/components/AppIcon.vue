<script setup lang="ts">
// Line icons from the design draft, 24x24 with a round stroke.
// All icons are decorative (aria-hidden), the surrounding element carries the label.
import type { AppIconName } from '@/icons'

withDefaults(defineProps<{ name: AppIconName; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 2,
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'arrow-left'"><path d="M19 12H5M12 19l-7-7 7-7" /></template>
    <template v-else-if="name === 'calendar'">
      <rect x="4" y="5" width="16" height="16" rx="2" /><path d="M16 3v4M8 3v4M4 11h16" />
    </template>
    <template v-else-if="name === 'check'"><path d="M5 12l5 5L20 7" /></template>
    <template v-else-if="name === 'chevron-down'"><path d="M6 9l6 6 6-6" /></template>
    <template v-else-if="name === 'chevron-right'"><path d="M9 6l6 6-6 6" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></template>
    <template v-else-if="name === 'close'"><path d="M18 6L6 18M6 6l12 12" /></template>
    <template v-else-if="name === 'external'">
      <path d="M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /><path d="M11 13l9-9M15 4h5v5" />
    </template>
    <template v-else-if="name === 'fish'">
      <path d="M3 12c2.5-3.5 6-5.5 10-5.5 3.5 0 6 2 8 5.5-2 3.5-4.5 5.5-8 5.5-4 0-7.5-2-10-5.5z" />
      <path d="M3 12L1 9.5M3 12l-2 2.5" />
      <circle cx="16.5" cy="11" r="0.8" fill="currentColor" />
    </template>
    <template v-else-if="name === 'layers'">
      <path d="M12 4l8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16l8 4 8-4" />
    </template>
    <template v-else-if="name === 'locate'">
      <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </template>
    <template v-else-if="name === 'lock'"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></template>
    <template v-else-if="name === 'member'">
      <circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20v-1.5a4.5 4.5 0 0 0-3-4.2" />
    </template>
    <template v-else-if="name === 'minus'"><path d="M5 12h14" /></template>
    <template v-else-if="name === 'moon'"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></template>
    <template v-else-if="name === 'phone'">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="name === 'question'"><path d="M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 1.7V14" /><path d="M12 18h.01" /></template>
    <template v-else-if="name === 'route'"><path d="M3 11l18-8-8 18-2-8z" /></template>
    <template v-else-if="name === 'shop'">
      <path d="M3 21h18" /><path d="M5 21V11M19 21V11" />
      <path d="M3 8l2-5h14l2 5c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3S3 9.7 3 8z" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </template>
  </svg>
</template>
