<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { GUEST_ACCESS } from '@/config'
import type { MapData, SalesPointFeature, WaterFeature } from '@/types'
import { formatPrice, phoneHref } from '@/utils/format'
import { describeOpeningStatus, formatOpeningHours, openingStatus } from '@/utils/time'

const props = withDefaults(
  defineProps<{
    salesPoint: SalesPointFeature
    data: MapData
    /** Injected for tests. */
    now?: Date
  }>(),
  { now: () => new Date() },
)

const emit = defineEmits<{ selectWater: [id: string]; selectClub: [id: string]; close: [] }>()

const p = computed(() => props.salesPoint.properties)

const opening = computed(() => (p.value.openingHours ? openingStatus(p.value.openingHours, props.now) : null))
const openingLines = computed(() =>
  p.value.openingHours ? formatOpeningHours(p.value.openingHours, props.now.getMonth() + 1) : [],
)

const routeUrl = computed(() => {
  const [lon, lat] = props.salesPoint.geometry.coordinates
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
})

/** Waters grouped by club, clubs in the order they first appear. */
const groups = computed(() => {
  const byClub = new Map<string, { clubId: string; clubName: string; known: boolean; waters: WaterFeature[] }>()
  for (const id of p.value.waterIds ?? []) {
    const water = props.data.watersById.get(id)
    if (!water) continue
    const clubId = water.properties.clubId
    const club = props.data.clubsById.get(clubId)
    if (!byClub.has(clubId)) {
      byClub.set(clubId, { clubId, clubName: club?.name ?? 'Verein unbekannt', known: Boolean(club), waters: [] })
    }
    byClub.get(clubId)!.waters.push(water)
  }
  for (const group of byClub.values()) {
    group.waters.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'de'))
  }
  return [...byClub.values()]
})

const waterCount = computed(() => groups.value.reduce((sum, g) => sum + g.waters.length, 0))

function accessToken(water: WaterFeature) {
  return (GUEST_ACCESS[water.properties.guestAccess] ?? GUEST_ACCESS.unknown).token
}

function guestPrice(water: WaterFeature): string | null {
  if (water.properties.guestAccess === 'membersOnly') return null
  const price = water.properties.prices?.guest
  return typeof price === 'number' ? formatPrice(price) : '–'
}
</script>

<template>
  <article class="detail" :aria-label="`Details ${p.name}`">
    <button type="button" class="back-link" @click="emit('close')">
      <AppIcon name="arrow-left" :size="16" />Alle Gewässer
    </button>

    <header class="detail-header">
      <div class="detail-title">
        <p class="eyebrow">Verkaufsstelle</p>
        <h1 class="serif">{{ p.name }}</h1>
        <p class="subtitle">{{ p.address }}</p>
      </div>
      <button type="button" class="icon-button close-button" aria-label="Schließen" @click="emit('close')">
        <AppIcon name="close" :size="18" :stroke-width="2.2" />
      </button>
    </header>

    <div v-if="opening || p.openingHoursNote" class="opening">
      <div v-if="opening" class="opening-status">
        <span class="dot" :class="opening.open ? 'is-open' : 'is-closed'" />
        <strong :class="opening.open ? 'is-open' : 'is-closed'">{{ opening.open ? 'Geöffnet' : 'Geschlossen' }}</strong>
        <span class="visually-hidden">, </span>
        <span class="muted-inline">{{ describeOpeningStatus(opening) }}</span>
      </div>
      <details v-if="openingLines.length" class="opening-times">
        <summary>Alle Zeiten<AppIcon name="chevron-down" :size="16" /></summary>
        <dl>
          <template v-for="line in openingLines" :key="line.days">
            <dt>{{ line.days }}</dt>
            <dd>{{ line.hours }}</dd>
          </template>
        </dl>
      </details>
      <p v-if="p.openingHoursNote" class="muted">{{ p.openingHoursNote }}</p>
    </div>

    <div class="actions">
      <a v-if="p.phone" class="action" :href="phoneHref(p.phone)"><AppIcon name="phone" :size="18" />Anrufen</a>
      <a class="action is-primary" :href="routeUrl" target="_blank" rel="noopener">
        <AppIcon name="route" :size="18" />Route
      </a>
    </div>

    <section>
      <div class="list-heading">
        <h2 class="section-title serif">Tageskarten für {{ waterCount }} Gewässer</h2>
        <span v-if="waterCount" class="muted">Gastpreis</span>
      </div>
      <p v-if="!waterCount" class="muted">Noch keine Gewässer zugeordnet.</p>
      <div v-for="group in groups" :key="group.clubId" class="club-group">
        <p class="section-label">
          <button v-if="group.known" type="button" class="club-link" @click="emit('selectClub', group.clubId)">
            {{ group.clubName }}<AppIcon name="chevron-right" :size="15" />
          </button>
          <template v-else>{{ group.clubName }}</template>
        </p>
        <button
          v-for="water in group.waters"
          :key="water.properties.id"
          type="button"
          class="water-row"
          @click="emit('selectWater', water.properties.id)"
        >
          <span class="access-dot" :style="{ background: `var(--${accessToken(water)})` }" />
          <span class="water-name">{{ water.properties.name }}</span>
          <span v-if="guestPrice(water)" class="water-price">{{ guestPrice(water) }}</span>
          <span v-else class="members-only">nur Mitglieder</span>
        </button>
      </div>
    </section>

    <p v-if="p.coordinatesApproximate" class="muted warning-text">Die Position auf der Karte ist nur ungefähr.</p>
  </article>
</template>

<style scoped>
.opening {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.opening-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot.is-open {
  background: var(--open);
}

.dot.is-closed {
  background: var(--closed);
}

strong.is-open {
  color: var(--open-text);
}

strong.is-closed {
  color: var(--closed-text);
}

.muted-inline {
  color: var(--text-2);
}

.opening-times summary {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--accent-text);
  font-weight: 500;
  list-style: none;
  cursor: pointer;
}

.opening-times summary::-webkit-details-marker {
  display: none;
}

.opening-times dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  margin: 8px 0 0;
  color: var(--text-2);
}

.opening-times dd {
  margin: 0;
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 10px;
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: 14px;
  background: var(--surface-3);
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.action.is-primary {
  background: var(--accent);
  color: var(--on-accent);
}

.action.is-primary:hover {
  color: var(--on-accent);
  filter: brightness(1.08);
}

.list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.club-group + .club-group {
  margin-top: 14px;
}

.club-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  text-align: left;
  cursor: pointer;
}

.club-link:hover {
  color: var(--accent-text);
}

.club-group .section-label {
  margin: 0 0 4px;
}

.water-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: none;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.water-row:hover .water-name {
  color: var(--accent-text);
}

.access-dot {
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.water-name {
  flex: 1;
  min-width: 0;
}

.water-price {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.members-only {
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--closed-bg);
  color: var(--closed-text);
  font-size: 13px;
  font-weight: 600;
}

.warning-text {
  color: var(--member-text);
}
</style>
