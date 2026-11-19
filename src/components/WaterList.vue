<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useFavourites } from '@/composables/useFavourites'
import { useLocation } from '@/composables/useLocation'
import { DEFAULT_ORIGIN, GUEST_ACCESS } from '@/config'
import type { MapData } from '@/types'
import { distanceToWaterKm, formatDistance } from '@/utils/distance'
import { formatPrice } from '@/utils/format'
import { guestPriceOn } from '@/utils/prices'

const props = defineProps<{
  data: MapData
  matchingIds?: Set<string> | null
  /** Day the prices are shown for, today when missing. */
  day?: Date
}>()
const emit = defineEmits<{ selectWater: [id: string] }>()

const sortBy = ref<'name' | 'distance'>('name')
const location = useLocation()
const { isFavourite } = useFavourites()

/** Own location once known, otherwise the configured start. */
const origin = computed(() =>
  sortBy.value === 'distance' ? (location.position.value ?? DEFAULT_ORIGIN) : null,
)

const originNote = computed(() => {
  if (sortBy.value !== 'distance') return null
  switch (location.status.value) {
    case 'found':
      return 'Luftlinie von deinem Standort'
    case 'locating':
      return `Standort wird ermittelt, bis dahin Luftlinie von ${DEFAULT_ORIGIN.name}`
    default:
      return `Luftlinie von ${DEFAULT_ORIGIN.name}, dein Standort ist nicht freigegeben`
  }
})

function sortByDistance() {
  sortBy.value = 'distance'
  location.request()
}

const waters = computed(() => {
  const from = origin.value
  const today = props.day ?? new Date()
  return props.data.waters.features
    .filter((w) => !props.matchingIds || props.matchingIds.has(w.properties.id))
    .map((water) => {
      const p = water.properties
      const club = props.data.clubsById.get(p.clubId)
      const guest = guestPriceOn(p, today)
      return {
        id: p.id,
        name: p.name,
        clubName: club ? (club.shortName ?? club.name) : null,
        token: (GUEST_ACCESS[p.guestAccess] ?? GUEST_ACCESS.unknown).token,
        price: p.guestAccess === 'membersOnly' ? null : typeof guest === 'number' ? formatPrice(guest) : null,
        km: from ? distanceToWaterKm(from, water.geometry) : null,
        favourite: isFavourite(p.id),
      }
    })
    .sort((a, b) =>
      a.km !== null && b.km !== null && a.km !== b.km ? a.km - b.km : a.name.localeCompare(b.name, 'de'),
    )
    .map((row) => ({ ...row, distance: row.km === null ? null : formatDistance(row.km) }))
})
</script>

<template>
  <section class="water-list" aria-label="Alle Gewässer">
    <div v-if="!matchingIds">
      <h1 class="serif">Alle Gewässer</h1>
      <p class="muted">
        {{ waters.length }} Gewässer und {{ data.salesPoints.features.length }} Verkaufsstellen. Wähle ein Gewässer auf
        der Karte oder in der Liste.
      </p>
    </div>
    <div v-if="waters.length > 1" class="sort">
      <div class="sort-toggle" role="group" aria-label="Sortieren">
        <button type="button" :class="{ 'is-active': sortBy === 'name' }" :aria-pressed="sortBy === 'name'" @click="sortBy = 'name'">
          Name
        </button>
        <button
          type="button"
          :class="{ 'is-active': sortBy === 'distance' }"
          :aria-pressed="sortBy === 'distance'"
          @click="sortByDistance"
        >
          Entfernung
        </button>
      </div>
      <p v-if="originNote" class="muted origin-note" role="status">{{ originNote }}</p>
    </div>

    <p v-if="matchingIds && waters.length === 0" class="muted empty">Keine Gewässer passen zu den Filtern.</p>
    <ul v-else>
      <li v-for="water in waters" :key="water.id">
        <button type="button" class="row" @click="emit('selectWater', water.id)">
          <span class="dot" :style="{ background: `var(--${water.token})` }" />
          <span class="name">
            <span
              >{{ water.name
              }}<span v-if="water.favourite" class="favourite-mark"
                ><AppIcon name="star-filled" :size="13" /><span class="visually-hidden">, gemerkt</span></span
              ></span
            >{{ ' ' }}<span v-if="water.clubName || water.distance" class="club">
              {{ [water.clubName, water.distance].filter(Boolean).join(' · ') }}
            </span>
          </span>
          <span v-if="water.price" class="price">{{ water.price }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.favourite-mark {
  display: inline-flex;
  margin-left: 4px;
  vertical-align: -1px;
  color: var(--accent);
}

.water-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 6px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: none;
  text-align: left;
  cursor: pointer;
}

.row:hover .name {
  color: var(--accent-text);
}

.dot {
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.name {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-size: 15px;
}

.club {
  font-size: 12px;
  color: var(--text-2);
}

.empty {
  padding: 8px 0;
}

.sort {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sort-toggle {
  display: inline-flex;
  align-self: flex-start;
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  background: var(--surface-3);
}

.sort-toggle button {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.sort-toggle button.is-active {
  background: var(--surface-2);
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.origin-note {
  font-size: 12px;
}

.price {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
