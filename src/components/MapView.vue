<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import MapLegend from '@/components/MapLegend.vue'
import { useTheme } from '@/composables/useTheme'
import { AERIAL_LABELS, AERIAL_LAYER, type BaseLayer, GUEST_ACCESS, REGION_BOUNDS, TILE_LAYERS } from '@/config'
import type { MapData, Selection, WaterFeature, WaterGeometry, WaterProperties } from '@/types'
import { dataBounds } from '@/utils/bounds'

const props = defineProps<{ data: MapData; matchingIds?: Set<string> | null }>()
const selection = defineModel<Selection | null>('selection', { default: null })

const { theme } = useTheme()

/** Must match the breakpoint in App.vue and style.css. */
const MOBILE_QUERY = '(max-width: 899px)'
/** More linked items than this and the map gets too busy for name labels. */
const MAX_LABELS = 8

const SHOP_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 21h18"/><path d="M5 21V11M19 21V11"/>' +
  '<path d="M3 8l2-5h14l2 5c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3S3 9.7 3 8z"/></svg>'

const container = useTemplateRef<HTMLElement>('container')
const map = shallowRef<L.Map | null>(null)

const showWaters = ref(true)
const showSalesPoints = ref(true)
const baseLayer = ref<BaseLayer>('map')
const layersOpen = ref(false)
const locateMessage = ref<string | null>(null)

// Leaflet objects are kept outside of Vue reactivity on purpose.
const waterLayersById = new Map<string, L.Polyline>()
const markersById = new Map<string, L.Marker>()
const overlay = L.layerGroup()
let watersLayer: L.GeoJSON<WaterProperties, WaterGeometry> | null = null
let salesPointsLayer: L.GeoJSON | null = null
let tileLayer: L.TileLayer | null = null
// Created on first use, so nothing is requested from the aerial service until someone switches.
let aerialLayer: L.TileLayer.WMS | null = null
let aerialLabels: L.TileLayer | null = null
let locationMarker: L.CircleMarker | null = null
let locateMessageTimer: ReturnType<typeof setTimeout> | undefined
let limit: L.LatLngBounds | null = null

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
}

function isLine(feature: WaterFeature): boolean {
  return feature.geometry.type.includes('LineString')
}

function accessToken(feature: WaterFeature) {
  return (GUEST_ACCESS[feature.properties.guestAccess] ?? GUEST_ACCESS.unknown).token
}

function waterStyle(feature: WaterFeature, state: 'default' | 'dimmed' | 'linked' | 'selected'): L.PathOptions {
  const token = accessToken(feature)
  const color = cssVar(token)
  const line = isLine(feature)
  const base: L.PathOptions = {
    color,
    fillColor: color,
    weight: line ? 5 : 2,
    opacity: 0.9,
    fillOpacity: 0.35,
    lineCap: 'round',
    dashArray: token === 'unknown' ? '6 6' : undefined,
  }
  switch (state) {
    case 'dimmed':
      return { ...base, opacity: 0.35, fillOpacity: 0.12 }
    case 'linked':
      return { ...base, weight: line ? 7 : 3, opacity: 1, fillOpacity: 0.55 }
    case 'selected':
      return line
        ? { ...base, weight: 9, opacity: 1 }
        : { ...base, color: cssVar('accent'), weight: 3.5, opacity: 1, fillOpacity: 0.85 }
    default:
      return base
  }
}

function pinIcon(state: 'default' | 'dimmed' | 'linked' | 'selected'): L.DivIcon {
  const size = state === 'selected' ? 38 : 30
  return L.divIcon({
    className: '',
    html: `<div class="pin${state === 'default' ? '' : ` is-${state}`}">${SHOP_ICON}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function fitOptions(): L.FitBoundsOptions {
  if (window.matchMedia(MOBILE_QUERY).matches) {
    // Keep clear of the search bar on top and the bottom sheet.
    return {
      paddingTopLeft: [30, 90],
      paddingBottomRight: [30, Math.round(window.innerHeight * 0.62) + 20],
      maxZoom: 14,
    }
  }
  return { padding: [70, 70], maxZoom: 14 }
}

/** Zooming out stops once the whole area with data is visible. */
function updateMinZoom(m: L.Map) {
  if (limit) m.setMinZoom(m.getBoundsZoom(limit))
}

function waterCenter(id: string): L.LatLng | null {
  return waterLayersById.get(id)?.getBounds().getCenter() ?? null
}

onMounted(() => {
  // The map cannot be panned or zoomed out away from the area with data, so there is always something to see.
  limit = L.latLngBounds(dataBounds(props.data, REGION_BOUNDS))

  // Popups are not used, the details live in the side panel.
  const m = L.map(container.value!, {
    zoomControl: false,
    closePopupOnClick: false,
    maxBounds: limit,
    maxBoundsViscosity: 1,
  })
  m.attributionControl.setPrefix(false)
  updateMinZoom(m)
  m.on('resize', () => updateMinZoom(m))
  m.fitBounds(REGION_BOUNDS)

  const tiles = TILE_LAYERS[theme.value]
  tileLayer = L.tileLayer(tiles.url, tiles.options).addTo(m)

  // Place names for the aerial images sit above the waters but let clicks through.
  const labelsPane = m.createPane('labels')
  labelsPane.style.zIndex = '450'
  labelsPane.style.pointerEvents = 'none'

  watersLayer = L.geoJSON<WaterProperties, WaterGeometry>(props.data.waters, {
    // Leaflet types the callback with a generic geometry, the data only contains water geometries.
    style: (feature) => waterStyle(feature as WaterFeature, 'default'),
    onEachFeature: (feature, layer) => {
      const id = feature.properties.id
      waterLayersById.set(id, layer as L.Polyline)
      layer.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event)
        selection.value = { kind: 'water', id }
      })
    },
  }).addTo(m)

  overlay.addTo(m)

  salesPointsLayer = L.geoJSON(props.data.salesPoints, {
    pointToLayer: (feature, latlng) => {
      const id = feature.properties.id as string
      const marker = L.marker(latlng, {
        icon: pinIcon('default'),
        title: feature.properties.name,
        alt: feature.properties.name,
        riseOnHover: true,
      })
      markersById.set(id, marker)
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event)
        selection.value = { kind: 'salesPoint', id }
      })
      return marker
    },
  }).addTo(m)

  m.on('click', () => {
    selection.value = null
    layersOpen.value = false
  })

  m.on('locationfound', (event: L.LocationEvent) => {
    locationMarker?.remove()
    locationMarker = null
    if (limit && !limit.contains(event.latlng)) {
      showLocateMessage('Du bist gerade außerhalb des Kartenbereichs.')
      return
    }
    m.setView(event.latlng, Math.max(m.getZoom(), 13))
    locationMarker = L.circleMarker(event.latlng, {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: cssVar('accent'),
      fillOpacity: 1,
      interactive: false,
    }).addTo(m)
  })

  m.on('locationerror', () => showLocateMessage('Dein Standort ist gerade nicht verfügbar.'))

  map.value = m
})

onBeforeUnmount(() => {
  clearTimeout(locateMessageTimer)
  map.value?.remove()
  map.value = null
})

function showLocateMessage(message: string) {
  locateMessage.value = message
  clearTimeout(locateMessageTimer)
  locateMessageTimer = setTimeout(() => (locateMessage.value = null), 4000)
}

function locate() {
  // The view is set in the locationfound handler, only when the location is inside the limits.
  map.value?.locate()
}

function zoom(delta: number) {
  map.value?.setZoom(map.value.getZoom() + delta)
}

/** Styles, labels, halo and connection lines for the current selection. */
function applyHighlight() {
  const m = map.value
  if (!m || !watersLayer) return

  overlay.clearLayers()
  waterLayersById.forEach((layer) => layer.unbindTooltip())
  markersById.forEach((marker) => marker.unbindTooltip())

  const sel = selection.value
  const selectedWater = sel?.kind === 'water' ? sel.id : null
  const selectedSalesPoint = sel?.kind === 'salesPoint' ? sel.id : null
  const selectedClub = sel?.kind === 'club' ? sel.id : null
  const linkedWaters = new Set(
    selectedSalesPoint
      ? (props.data.salesPointsById.get(selectedSalesPoint)?.properties.waterIds ?? [])
      : selectedClub
        ? (props.data.waterIdsByClub.get(selectedClub) ?? [])
        : [],
  )
  const linkedSalesPoints = new Set(
    selectedWater
      ? (props.data.salesPointIdsByWater.get(selectedWater) ?? [])
      : [...linkedWaters].flatMap((id) => (selectedClub ? (props.data.salesPointIdsByWater.get(id) ?? []) : [])),
  )

  const filtered = props.matchingIds ?? null
  waterLayersById.forEach((layer, id) => {
    const feature = props.data.watersById.get(id)
    if (!feature) return
    const state = sel
      ? id === selectedWater
        ? 'selected'
        : linkedWaters.has(id)
          ? 'linked'
          : 'dimmed'
      : filtered && !filtered.has(id)
        ? 'dimmed'
        : 'default'
    layer.setStyle(waterStyle(feature, state))
  })

  markersById.forEach((marker, id) => {
    const state = !sel ? 'default' : id === selectedSalesPoint ? 'selected' : linkedSalesPoints.has(id) ? 'linked' : 'dimmed'
    marker.setIcon(pinIcon(state))
    marker.setZIndexOffset(state === 'selected' ? 1000 : state === 'linked' ? 500 : 0)
  })

  if (!sel) return
  const accent = cssVar('accent')
  // Many lines at once (a shop selling for 40 waters) are easier to read when lighter.
  const lineOpacity = Math.max(linkedSalesPoints.size, linkedWaters.size) > 12 ? 0.45 : 0.9
  const line = (from: L.LatLng, to: L.LatLng) =>
    L.polyline([from, to], { color: accent, weight: 2.5, dashArray: '6 7', opacity: lineOpacity, interactive: false })

  if (selectedWater) {
    const layer = waterLayersById.get(selectedWater)
    const feature = props.data.watersById.get(selectedWater)
    const center = waterCenter(selectedWater)
    if (!layer || !feature || !center) return

    for (const id of linkedSalesPoints) {
      const marker = markersById.get(id)
      if (marker) line(center, marker.getLatLng()).addTo(overlay)
    }
    // White halo below the selected water so it stands out from its neighbours.
    L.geoJSON(feature, {
      interactive: false,
      style: { color: cssVar('surface-2'), weight: isLine(feature) ? 16 : 10, opacity: 1, fill: false },
    }).addTo(overlay)
    layer.bringToFront()

    // Above the water, so the label does not hide a small lake.
    layer
      .bindTooltip(feature.properties.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
        className: 'map-label is-water',
      })
      .openTooltip(L.latLng(layer.getBounds().getNorth(), center.lng))
    if (linkedSalesPoints.size <= MAX_LABELS) {
      for (const id of linkedSalesPoints) labelMarker(id)
    }
  } else if (selectedSalesPoint) {
    const marker = markersById.get(selectedSalesPoint)
    if (!marker) return
    for (const id of linkedWaters) {
      const center = waterCenter(id)
      if (center) line(marker.getLatLng(), center).addTo(overlay)
      waterLayersById.get(id)?.bringToFront()
    }
    labelMarker(selectedSalesPoint)
  } else if (selectedClub) {
    // No connection lines, the club's waters are what matters. Names only while they fit.
    for (const id of linkedWaters) waterLayersById.get(id)?.bringToFront()
    if (linkedWaters.size <= MAX_LABELS) {
      for (const id of linkedWaters) labelWater(id)
    }
  }
}

function labelWater(id: string) {
  const layer = waterLayersById.get(id)
  const name = props.data.watersById.get(id)?.properties.name
  const center = waterCenter(id)
  if (layer && name && center) {
    layer
      .bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -10], className: 'map-label' })
      .openTooltip(L.latLng(layer.getBounds().getNorth(), center.lng))
  }
}

function labelMarker(id: string) {
  const marker = markersById.get(id)
  const name = props.data.salesPointsById.get(id)?.properties.name
  if (marker && name) {
    // auto: right of the pin, or left of it near the right edge of the map.
    marker.bindTooltip(name, { permanent: true, direction: 'auto', offset: [18, 0], className: 'map-label' }).openTooltip()
  }
}

function fitToSelection() {
  const m = map.value
  const sel = selection.value
  if (!m || !sel) return
  const bounds = L.latLngBounds([])
  if (sel.kind === 'water') {
    const layer = waterLayersById.get(sel.id)
    if (layer) bounds.extend(layer.getBounds())
    for (const id of props.data.salesPointIdsByWater.get(sel.id) ?? []) {
      const marker = markersById.get(id)
      if (marker) bounds.extend(marker.getLatLng())
    }
  } else if (sel.kind === 'club') {
    // Only the waters: a shop selling for the club can be far away and would zoom out too much.
    for (const id of props.data.waterIdsByClub.get(sel.id) ?? []) {
      const layer = waterLayersById.get(id)
      if (layer) bounds.extend(layer.getBounds())
    }
  } else {
    const marker = markersById.get(sel.id)
    if (marker) bounds.extend(marker.getLatLng())
    for (const id of props.data.salesPointsById.get(sel.id)?.properties.waterIds ?? []) {
      const layer = waterLayersById.get(id)
      if (layer) bounds.extend(layer.getBounds())
    }
  }
  if (bounds.isValid()) m.fitBounds(bounds, fitOptions())
}

watch([selection, map], () => {
  applyHighlight()
  fitToSelection()
})

// Re-dim the map when the filter changes. Only fit bounds when nothing is selected.
watch(
  () => props.matchingIds,
  () => {
    applyHighlight()
    if (!selection.value) fitToFilter()
  },
)

function fitToFilter() {
  const m = map.value
  const ids = props.matchingIds
  if (!m || !ids) return
  const bounds = L.latLngBounds([])
  for (const id of ids) {
    const layer = waterLayersById.get(id)
    if (layer) bounds.extend(layer.getBounds())
  }
  if (bounds.isValid()) m.fitBounds(bounds, fitOptions())
}

// The theme watcher in useTheme sets data-theme first, post flush reads the new colours.
watch(
  theme,
  (value) => {
    tileLayer?.setUrl(TILE_LAYERS[value].url)
    applyHighlight()
  },
  { flush: 'post' },
)

watch(baseLayer, (value) => {
  const m = map.value
  if (!m || !tileLayer) return
  if (value === 'aerial') {
    aerialLayer ??= L.tileLayer.wms(AERIAL_LAYER.url, AERIAL_LAYER.options)
    aerialLabels ??= L.tileLayer(AERIAL_LABELS.url, { ...AERIAL_LABELS.options, pane: 'labels' })
    tileLayer.remove()
    aerialLayer.addTo(m)
    aerialLabels.addTo(m)
  } else {
    aerialLayer?.remove()
    aerialLabels?.remove()
    tileLayer.addTo(m)
  }
})

watch(showWaters, (visible) => {
  if (!map.value || !watersLayer) return
  if (visible) {
    watersLayer.addTo(map.value)
    overlay.addTo(map.value)
  } else {
    watersLayer.remove()
    overlay.remove()
  }
})

watch(showSalesPoints, (visible) => {
  if (!map.value || !salesPointsLayer) return
  if (visible) salesPointsLayer.addTo(map.value)
  else salesPointsLayer.remove()
})
</script>

<template>
  <div class="map-view">
    <div ref="container" class="map" role="application" aria-label="Karte der Gewässer und Verkaufsstellen" />

    <div class="layer-toggle glass desktop-only" role="group" aria-label="Ebenen">
      <button type="button" :class="{ 'is-active': showWaters }" :aria-pressed="showWaters" @click="showWaters = !showWaters">
        Gewässer
      </button>
      <button
        type="button"
        :class="{ 'is-active': showSalesPoints }"
        :aria-pressed="showSalesPoints"
        @click="showSalesPoints = !showSalesPoints"
      >
        Verkaufsstellen
      </button>
      <span class="divider" aria-hidden="true" />
      <button
        type="button"
        :class="{ 'is-active': baseLayer === 'aerial' }"
        :aria-pressed="baseLayer === 'aerial'"
        @click="baseLayer = baseLayer === 'aerial' ? 'map' : 'aerial'"
      >
        Luftbild
      </button>
    </div>

    <div class="controls">
      <div class="zoom glass desktop-only">
        <button type="button" aria-label="Hineinzoomen" @click="zoom(1)"><AppIcon name="plus" /></button>
        <button type="button" aria-label="Herauszoomen" @click="zoom(-1)"><AppIcon name="minus" /></button>
      </div>
      <button type="button" class="icon-button control-button glass" aria-label="Mein Standort" @click="locate">
        <AppIcon name="locate" />
      </button>
      <button
        type="button"
        class="icon-button control-button glass mobile-only"
        aria-label="Ebenen und Legende"
        :aria-expanded="layersOpen"
        @click="layersOpen = !layersOpen"
      >
        <AppIcon name="layers" />
      </button>
      <div v-if="layersOpen" class="layers-popover glass mobile-only">
        <label><input v-model="showWaters" type="checkbox" /> Gewässer</label>
        <label><input v-model="showSalesPoints" type="checkbox" /> Verkaufsstellen</label>
        <label><input v-model="baseLayer" type="checkbox" true-value="aerial" false-value="map" /> Luftbild</label>
        <MapLegend embedded />
      </div>
    </div>

    <MapLegend class="legend-position desktop-only" />

    <p v-if="locateMessage" class="locate-message glass" role="status">{{ locateMessage }}</p>
  </div>
</template>

<style scoped>
.map-view {
  position: relative;
  height: 100%;
}

.map {
  height: 100%;
}

.layer-toggle,
.controls,
.legend-position,
.locate-message {
  position: absolute;
  z-index: 1000;
}

.layer-toggle {
  top: 20px;
  left: 20px;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
}

.layer-toggle button {
  height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.layer-toggle .divider {
  width: 1px;
  margin: 6px 2px;
  background: var(--border);
}

.layer-toggle button.is-active {
  background: var(--accent);
  color: var(--on-accent);
}

.controls {
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.zoom {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
}

.zoom button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.zoom button + button {
  border-top: 1px solid var(--border);
}

.control-button {
  border-radius: 14px;
}

.layers-popover {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  font-size: 14px;
}

.layers-popover label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layers-popover input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.legend-position {
  left: 20px;
  bottom: 20px;
}

.locate-message {
  left: 50%;
  bottom: 24px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  transform: translateX(-50%);
}

@media (min-width: 900px) {
  .mobile-only {
    display: none;
  }
}

@media (max-width: 899px) {
  .desktop-only {
    display: none;
  }

  /* Below the floating top bar from App.vue. */
  .controls {
    top: 80px;
    right: 16px;
  }

  .control-button {
    border-radius: 22px;
  }

  .locate-message {
    top: 80px;
    bottom: auto;
  }
}
</style>
