<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MapView from '@/components/MapView.vue'
import { useMapData } from '@/composables/useMapData'
import type { Selection } from '@/types'

const { data, error } = useMapData()
const selection = ref<Selection | null>(null)
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="app-main" aria-label="Karte der Gewässer und Ausgabestellen">
      <MapView v-if="data" v-model:selection="selection" :data="data" />
      <p v-else-if="error" class="app-message is-error">
        Die Kartendaten konnten nicht geladen werden.
      </p>
      <p v-else class="app-message">Karte wird geladen …</p>
    </main>
  </div>
</template>
