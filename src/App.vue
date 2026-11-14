<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ClubDetail from '@/components/ClubDetail.vue'
import ImprintPage from '@/components/ImprintPage.vue'
import MapView from '@/components/MapView.vue'
import SalesPointDetail from '@/components/SalesPointDetail.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import WaterDetail from '@/components/WaterDetail.vue'
import WaterFilters from '@/components/WaterFilters.vue'
import WaterList from '@/components/WaterList.vue'
import { routeHash, useHashRoute } from '@/composables/useHashRoute'
import { useMapData } from '@/composables/useMapData'
import { useTheme } from '@/composables/useTheme'
import type { Selection } from '@/types'
import { emptyFilter, isFilterActive, matchingWaterIds } from '@/utils/filter'

useTheme()
const { data, error } = useMapData()
const filter = reactive(emptyFilter())

// The URL hash is the single source of truth for what the panel shows.
const router = useHashRoute()
const IMPRINT_HREF = routeHash({ kind: 'imprint' })
const imprintOpen = computed(() => router.route.value?.kind === 'imprint')
const selection = computed<Selection | null>({
  get: () => {
    const route = router.route.value
    return route && route.kind !== 'imprint' ? route : null
  },
  set: (value) => router.navigate(value),
})

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
const selectedClub = computed(() =>
  selection.value?.kind === 'club' ? data.value?.clubsById.get(selection.value.id) : undefined,
)
const sheetOpen = computed(() => Boolean(selection.value) || listOpen.value || imprintOpen.value)

function selectWater(id: string) {
  router.navigate({ kind: 'water', id })
}

function selectSalesPoint(id: string) {
  router.navigate({ kind: 'salesPoint', id })
}

function selectClub(id: string) {
  router.navigate({ kind: 'club', id })
}

function openImprint() {
  router.navigate({ kind: 'imprint' })
}

// A shared link can point to something that is no longer in the data, show the list instead.
watch([data, selection], ([mapData, sel]) => {
  if (!mapData || !sel) return
  const exists =
    sel.kind === 'water'
      ? mapData.watersById.has(sel.id)
      : sel.kind === 'salesPoint'
        ? mapData.salesPointsById.has(sel.id)
        : mapData.clubsById.has(sel.id)
  if (!exists) router.replace(null)
})

// Start every new page at the top.
watch(router.route, async () => {
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
        v-if="!selection && !imprintOpen"
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
        <ImprintPage v-if="imprintOpen" @close="router.close" />
        <template v-else-if="data">
          <WaterDetail
            v-if="selectedWater"
            :key="selectedWater.properties.id"
            :water="selectedWater"
            :data="data"
            @select-sales-point="selectSalesPoint"
            @select-club="selectClub"
            @close="router.close"
          />
          <SalesPointDetail
            v-else-if="selectedSalesPoint"
            :key="selectedSalesPoint.properties.id"
            :sales-point="selectedSalesPoint"
            :data="data"
            @select-water="selectWater"
            @select-club="selectClub"
            @close="router.close"
          />
          <ClubDetail
            v-else-if="selectedClub"
            :key="selectedClub.id"
            :club="selectedClub"
            :data="data"
            @select-water="selectWater"
            @select-sales-point="selectSalesPoint"
            @close="router.close"
          />
          <div v-else class="list-view">
            <WaterFilters
              :data="data"
              :filter="filter"
              :count="matchingIds ? matchingIds.size : data.waters.features.length"
              @select-club="selectClub"
            />
            <WaterList :data="data" :matching-ids="matchingIds" @select-water="selectWater" />
          </div>
        </template>

        <footer v-if="!imprintOpen" class="panel-footer">
          <a :href="IMPRINT_HREF" @click.prevent="openImprint">Impressum und Datenschutz</a>
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
            :href="IMPRINT_HREF"
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
