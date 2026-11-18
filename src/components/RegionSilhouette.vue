<script setup lang="ts">
import type { RegionId } from '@/config'

defineProps<{ region: RegionId }>()
</script>

<!--
  Hand drawn landscape outlines for the region dialog. All shapes use currentColor,
  so the parent sets colour and opacity and the outline follows the light and dark theme.
-->
<template>
  <svg
    class="silhouette"
    viewBox="0 0 240 64"
    preserveAspectRatio="xMaxYMax meet"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Augsburg: gabled roofs of the old town, the Rathaus with its two onion towers and the Perlachturm -->
    <g v-if="region === 'augsburg'" fill="currentColor">
      <path
        opacity="0.55"
        d="M0 64V50L8 42L16 50V48L24 40L32 48V51L40 43L48 51V47L57 39L66 47V50L74 42L82 50V49L90 41L98 49V48L107 40L116 48V51L124 43L132 51V49L140 41L148 49V47L157 39L166 47V50L174 42L182 50V48L190 40L198 48V50L207 42L216 50V49L224 41L232 49V51L236 43L240 51V64z"
      />
      <rect x="116" y="18" width="10" height="46" />
      <path d="M121 5C121 9 115 11 115 15Q115 18 121 18Q127 18 127 15C127 11 121 9 121 5Z" />
      <path d="M124 64V28h12l10-8 10 8h12v36z" />
      <rect x="166" y="18" width="10" height="46" />
      <path d="M171 5C171 9 165 11 165 15Q165 18 171 18Q177 18 177 15C177 11 171 9 171 5Z" />
      <rect x="184" y="14" width="8" height="50" />
      <path d="M188 2C188 6 183 8 183 12Q183 14 188 14Q193 14 193 12C193 8 188 6 188 2Z" />
    </g>

    <!-- Fernpass: mountain range above the Plansee, pines on both shores -->
    <g v-else-if="region === 'fernpass'" fill="currentColor">
      <path
        opacity="0.55"
        d="M0 64V40L28 18l14 10L72 4l22 22 12-8 30 26 20-14 26 18 18-12 32 22v20z"
      />
      <path d="M0 64V54Q30 48 64 55V64z" />
      <path d="M150 64V55Q196 46 240 52V64z" />
      <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none">
        <path d="M76 58h22M106 61h28M90 63h18" />
      </g>
      <path d="M20 30l-6 10h4l-6 10h16l-6-10h4z" />
      <path d="M36 36l-5 8h3l-5 8h14l-5-8h3z" />
      <path d="M172 34l-6 10h4l-6 10h16l-6-10h4z" />
      <path d="M188 28l-7 11h4l-7 11h20l-7-11h4z" />
      <path d="M206 36l-5 8h3l-5 8h14l-5-8h3z" />
    </g>

    <!-- Wilder Kaiser: the jagged limestone ridge above an alpine meadow with a chapel -->
    <g v-else-if="region === 'wilder-kaiser'" fill="currentColor">
      <path
        opacity="0.55"
        d="M0 48L14 40 22 44 32 30 38 36 48 14 52 22 60 6 66 18 72 12 80 28 90 8 96 18 100 12 110 28 122 18 130 26 140 12 146 20 158 16 174 28 188 26 206 36 222 34 240 42V64H0z"
      />
      <path d="M0 64V56Q60 49 120 54T240 51V64z" />
      <path d="M166 54V46l6-5 6 5v8z" />
      <path d="M178 54V42h3v12z" />
      <path d="M179.5 35l-3 7h6z" />
    </g>
  </svg>
</template>

<style scoped>
.silhouette {
  display: block;
}
</style>
