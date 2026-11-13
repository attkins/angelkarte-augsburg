<script setup lang="ts">
import L from 'leaflet'
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import MapLegend from '@/components/MapLegend.vue'
import MapPopup from '@/components/MapPopup.vue'
import SalesPointPopup from '@/components/SalesPointPopup.vue'
import WaterPopup from '@/components/WaterPopup.vue'
import { GUEST_ACCESS, HIGHLIGHT_COLOR, REGION_BOUNDS, TILE_LAYER } from '@/config'
import type { MapData, Selection, WaterFeature, WaterGeometry, WaterProperties } from '@/types'

const props = defineProps<{ data: MapData }>()
const selection = defineModel<Selection | null>('selection', { default: null })

const FIT_OPTIONS: L.FitBoundsOptions = { padding: [40, 40], maxZoom: 14, animate: false }

const container = useTemplateRef<HTMLElement>('container')
const map = shallowRef<L.Map | null>(null)

// Leaflet objects are kept outside of Vue reactivity on purpose.
const waterLayersById = new Map<string, L.Polyline>()
const salesPointMarkersById = new Map<string, L.Marker>()
let watersLayer: L.GeoJSON<WaterProperties, WaterGeometry> | null = null

function isLine(feature: WaterFeature): boolean {
  return feature.geometry.type.includes('LineString')
}

function waterStyle(feature?: WaterFeature): L.PathOptions {
  const access = feature ? GUEST_ACCESS[feature.properties.guestAccess] : undefined
  const color = (access ?? GUEST_ACCESS.unknown).color
  return {
    color,
    weight: feature && isLine(feature) ? 6 : 2,
    opacity: 0.9,
    fillColor: color,
    fillOpacity: 0.35,
  }
}

function highlightedWaterStyle(feature: WaterFeature): L.PathOptions {
  return {
    ...waterStyle(feature),
    color: HIGHLIGHT_COLOR,
    weight: isLine(feature) ? 9 : 5,
    opacity: 1,
  }
}

function salesPointIcon(highlighted = false): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="sales-point-icon${highlighted ? ' is-highlighted' : ''}" title="Ausgabestelle">€</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

onMounted(() => {
  // Popups are closed through the selection model, not by Leaflet itself.
  const m = L.map(container.value!, { closePopupOnClick: false })
  m.fitBounds(REGION_BOUNDS)
  L.tileLayer(TILE_LAYER.url, TILE_LAYER.options).addTo(m)

  watersLayer = L.geoJSON<WaterProperties, WaterGeometry>(props.data.waters, {
    // Leaflet types the style callback with a generic geometry, the data only contains water geometries.
    style: (feature) => waterStyle(feature as WaterFeature | undefined),
    onEachFeature: (feature, layer) => {
      const id = feature.properties.id
      waterLayersById.set(id, layer as L.Polyline)
      layer.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event)
        selection.value = { kind: 'water', id, latlng: event.latlng }
      })
    },
  }).addTo(m)

  const salesPointsLayer = L.geoJSON(props.data.salesPoints, {
    pointToLayer: (feature, latlng) => {
      const id = feature.properties.id as string
      const marker = L.marker(latlng, { icon: salesPointIcon(), title: feature.properties.name })
      salesPointMarkersById.set(id, marker)
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event)
        selection.value = { kind: 'salesPoint', id }
      })
      return marker
    },
  }).addTo(m)

  L.control
    .layers(undefined, { Gewässer: watersLayer, Ausgabestellen: salesPointsLayer }, { collapsed: false })
    .addTo(m)

  m.on('click', () => {
    selection.value = null
  })

  map.value = m
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

function clearHighlights() {
  watersLayer?.resetStyle()
  salesPointMarkersById.forEach((marker) => marker.setIcon(salesPointIcon()))
}

function highlightWater(waterId: string, bounds: L.LatLngBounds) {
  const layer = waterLayersById.get(waterId)
  const feature = props.data.watersById.get(waterId)
  if (!layer || !feature) return
  layer.setStyle(highlightedWaterStyle(feature))
  layer.bringToFront()
  bounds.extend(layer.getBounds())
}

function highlightSalesPoint(salesPointId: string, bounds: L.LatLngBounds) {
  const marker = salesPointMarkersById.get(salesPointId)
  if (!marker) return
  marker.setIcon(salesPointIcon(true))
  bounds.extend(marker.getLatLng())
}

// Highlight the selected item plus everything linked to it and zoom so that all of it is visible.
watch([selection, map], ([sel, m]) => {
  if (!m) return
  clearHighlights()
  if (!sel) return

  const bounds = L.latLngBounds([])
  if (sel.kind === 'water') {
    highlightWater(sel.id, bounds)
    for (const salesPointId of props.data.salesPointIdsByWater.get(sel.id) ?? []) {
      highlightSalesPoint(salesPointId, bounds)
    }
  } else {
    highlightSalesPoint(sel.id, bounds)
    for (const waterId of props.data.salesPointsById.get(sel.id)?.properties.waterIds ?? []) {
      highlightWater(waterId, bounds)
    }
  }

  if (bounds.isValid()) m.fitBounds(bounds, FIT_OPTIONS)
})

const selectedWater = computed(() =>
  selection.value?.kind === 'water' ? props.data.watersById.get(selection.value.id) : undefined,
)

const selectedSalesPoint = computed(() =>
  selection.value?.kind === 'salesPoint'
    ? props.data.salesPointsById.get(selection.value.id)
    : undefined,
)

const popupLatLng = computed<L.LatLngExpression | null>(() => {
  const sel = selection.value
  if (!sel || !map.value) return null
  if (sel.kind === 'water') {
    return sel.latlng ?? waterLayersById.get(sel.id)?.getBounds().getCenter() ?? null
  }
  return salesPointMarkersById.get(sel.id)?.getLatLng() ?? null
})

const popupOffset = computed<L.PointTuple>(() =>
  selection.value?.kind === 'salesPoint' ? [0, -10] : [0, 7],
)
</script>

<template>
  <div class="map-view">
    <div ref="container" class="map" />
    <MapLegend />
    <MapPopup
      v-if="map && popupLatLng && (selectedWater || selectedSalesPoint)"
      :map="map"
      :latlng="popupLatLng"
      :offset="popupOffset"
      @close="selection = null"
    >
      <WaterPopup
        v-if="selectedWater"
        :water="selectedWater"
        :data="data"
        @select-sales-point="(id) => (selection = { kind: 'salesPoint', id })"
      />
      <SalesPointPopup
        v-else-if="selectedSalesPoint"
        :sales-point="selectedSalesPoint"
        :data="data"
        @select-water="(id) => (selection = { kind: 'water', id })"
      />
    </MapPopup>
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
</style>
