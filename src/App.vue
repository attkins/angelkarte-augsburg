<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ImprintPage from '@/components/ImprintPage.vue'
import MapView from '@/components/MapView.vue'
import SalesPointDetail from '@/components/SalesPointDetail.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import WaterDetail from '@/components/WaterDetail.vue'
import WaterFilters from '@/components/WaterFilters.vue'
import WaterList from '@/components/WaterList.vue'
import { useHashPage } from '@/composables/useHashPage'
import { useMapData } from '@/composables/useMapData'
import { useTheme } from '@/composables/useTheme'
import { IMPRINT_HASH } from '@/config'
import type { Selection } from '@/types'
import { emptyFilter, isFilterActive, matchingWaterIds } from '@/utils/filter'

useTheme()
const { data, error } = useMapData()
const selection = ref<Selection | null>(null)
const filter = reactive(emptyFilter())
const imprint = useHashPage(IMPRINT_HASH)

/** Ids of the waters passing the filter, or null when no filter is active (all shown). */
const matchingIds = computed(() =>
  data.value && isFilterActive(filter) ? matchingWaterIds(data.value, filter, new Date()) : null,
)
/** Only used on small screens: whether the list is shown in the bottom sheet. */
const listOpen = ref(false)
const panel = useTemplateRef<HTMLElement>('panel')

const selectedWater = computed(() =>
  selection.value?.kind === 'water' ? data.value?.watersById.get(selection.value.id) : undefined,
)
const selectedSalesPoint = computed(() =>
  selection.value?.kind === 'salesPoint' ? data.value?.salesPointsById.get(selection.value.id) : undefined,
)
const sheetOpen = computed(() => Boolean(selection.value) || listOpen.value || imprint.active.value)

function selectWater(id: string) {
  selection.value = { kind: 'water', id }
}

function selectSalesPoint(id: string) {
  selection.value = { kind: 'salesPoint', id }
}

function closeDetail() {
  selection.value = null
}

function openImprint() {
  selection.value = null
  imprint.open()
}

// Selecting something on the map leaves the imprint.
watch(selection, (value) => {
  if (value) imprint.close()
})

// Start every new detail and the imprint at the top.
watch([selection, imprint.active], async () => {
  await nextTick()
  panel.value?.querySelector('.panel-body')?.scrollTo({ top: 0 })
  panel.value?.scrollTo({ top: 0 })
})
</script>

<template>
  <div class="app">
    <aside ref="panel" class="panel" :class="{ 'is-open': sheetOpen }">
      <header class="panel-header">
        <div class="logo"><AppIcon name="fish" :size="24" :stroke-width="1.9" /></div>
        <div class="brand">
          <div class="brand-title serif">Angelkarte</div>
          <div class="brand-sub">Augsburg und Umland</div>
        </div>
        <ThemeToggle />
      </header>

      <button
        v-if="!selection && !imprint.active.value"
        type="button"
        class="sheet-handle"
        :aria-expanded="listOpen"
        @click="listOpen = !listOpen"
      >
        <span class="grip" />
        <span v-if="data">{{ listOpen ? 'Liste schließen' : `Alle ${data.waters.features.length} Gewässer` }}</span>
      </button>
      <div v-else class="sheet-handle is-static" aria-hidden="true"><span class="grip" /></div>

      <div class="panel-body">
        <ImprintPage v-if="imprint.active.value" @close="imprint.close" />
        <template v-else-if="data">
          <WaterDetail
            v-if="selectedWater"
            :key="selectedWater.properties.id"
            :water="selectedWater"
            :data="data"
            @select-sales-point="selectSalesPoint"
            @close="closeDetail"
          />
          <SalesPointDetail
            v-else-if="selectedSalesPoint"
            :key="selectedSalesPoint.properties.id"
            :sales-point="selectedSalesPoint"
            :data="data"
            @select-water="selectWater"
            @close="closeDetail"
          />
          <div v-else class="list-view">
            <WaterFilters :data="data" :filter="filter" :count="matchingIds ? matchingIds.size : data.waters.features.length" />
            <WaterList :data="data" :matching-ids="matchingIds" @select-water="selectWater" />
          </div>
        </template>

        <footer v-if="!imprint.active.value" class="panel-footer">
          <a :href="IMPRINT_HASH" @click.prevent="openImprint">Impressum und Datenschutz</a>
        </footer>
      </div>
    </aside>

    <main class="map-area">
      <MapView v-if="data" v-model:selection="selection" :data="data" :matching-ids="matchingIds" />
      <p v-else-if="error" class="app-message is-error">Die Kartendaten konnten nicht geladen werden.</p>
      <p v-else class="app-message">Karte wird geladen …</p>

      <div class="mobile-bar">
        <div class="brand-pill glass">
          <AppIcon name="fish" :size="20" :stroke-width="1.9" />
          <span class="serif">Angelkarte</span>
        </div>
        <div class="mobile-actions">
          <a
            class="icon-button glass imprint-button"
            :href="IMPRINT_HASH"
            aria-label="Impressum und Datenschutz"
            @click.prevent="openImprint"
          >
            <AppIcon name="info" />
          </a>
          <ThemeToggle floating />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100%;
  background: var(--land);
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  color: var(--text);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent);
  color: var(--on-accent);
}

.brand {
  flex: 1;
}

.brand-title {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
}

.brand-sub {
  font-size: 13px;
  color: var(--text-2);
}

.panel-body {
  padding: 16px 24px 28px;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-footer {
  margin-top: 28px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 13px;
}

.panel-footer a {
  color: var(--text-2);
}

.panel-footer a:hover {
  color: var(--accent-text);
}

.map-area {
  position: relative;
  flex: 1;
  min-width: 0;
}

.app-message {
  margin: 2rem;
  text-align: center;
  color: var(--text-2);
}

.app-message.is-error {
  color: var(--closed-text);
}

.mobile-bar {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  left: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.mobile-bar > * {
  pointer-events: auto;
}

.brand-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 18px;
  border-radius: 24px;
  font-size: 18px;
  font-weight: 600;
}

.brand-pill svg {
  color: var(--accent-text);
}

.mobile-actions {
  display: flex;
  gap: 8px;
}

.mobile-bar .theme-toggle,
.mobile-bar .imprint-button {
  width: 48px;
  height: 48px;
  border-radius: 24px;
}

.imprint-button {
  color: var(--text);
}

.sheet-handle {
  display: none;
}

@media (min-width: 900px) {
  .panel {
    flex: 0 0 var(--panel-width);
    width: var(--panel-width);
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }

  .mobile-bar {
    display: none;
  }
}

@media (max-width: 899px) {
  .app {
    position: relative;
  }

  .map-area {
    position: absolute;
    inset: 0;
  }

  .panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1100;
    max-height: 62vh;
    padding-bottom: env(safe-area-inset-bottom);
    border-radius: 26px 26px 0 0;
    box-shadow: var(--shadow);
  }

  .panel-header {
    display: none;
  }

  .sheet-handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 20px 14px;
    border: 0;
    background: none;
    color: var(--text);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  .sheet-handle.is-static {
    padding-bottom: 4px;
    cursor: default;
  }

  .grip {
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background: var(--border);
  }

  .panel-body {
    overflow-y: auto;
    padding: 4px 20px 20px;
  }

  .panel:not(.is-open) .panel-body {
    display: none;
  }
}
</style>
