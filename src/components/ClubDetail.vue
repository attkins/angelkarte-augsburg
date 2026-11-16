<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ShareButton from '@/components/ShareButton.vue'
import { GUEST_ACCESS } from '@/config'
import type { Club, MapData, SalesPointFeature, WaterFeature } from '@/types'
import { formatPrice } from '@/utils/format'
import { guestPriceOn } from '@/utils/prices'
import { availability, formatRange } from '@/utils/time'

const props = withDefaults(
  defineProps<{
    club: Club
    data: MapData
    /** Injected for tests, or the planned day at midnight. */
    now?: Date
    /** Whether `now` is a day the user plans for. */
    planned?: boolean
  }>(),
  { now: () => new Date(), planned: false },
)

const emit = defineEmits<{ selectWater: [id: string]; selectSalesPoint: [id: string]; close: [] }>()

const waters = computed(() =>
  (props.data.waterIdsByClub.get(props.club.id) ?? [])
    .map((id) => props.data.watersById.get(id))
    .filter((w): w is WaterFeature => Boolean(w))
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'de'))
    .map((water) => {
      const p = water.properties
      const membersOnly = p.guestAccess === 'membersOnly'
      const closed = !membersOnly && !availability(p.season, p.guestPeriod, props.now, props.planned).openForGuestsToday
      const guest = guestPriceOn(p, props.now)
      const details = [
        closed ? null : p.season ? `Saison ${formatRange(p.season)}` : null,
        p.onlinePurchase?.url ? 'online buchbar' : null,
      ].filter(Boolean)
      return {
        id: p.id,
        name: p.name,
        token: (GUEST_ACCESS[p.guestAccess] ?? GUEST_ACCESS.unknown).token,
        membersOnly,
        closed,
        details: details.join(', '),
        price: typeof guest === 'number' ? formatPrice(guest) : '–',
      }
    }),
)

/** Sales points that sell a ticket for at least one water of the club, the ones with most waters first. */
const salesPoints = computed(() => {
  const clubWaters = new Set(waters.value.map((w) => w.id))
  return props.data.salesPoints.features
    .map((sp: SalesPointFeature) => ({
      id: sp.properties.id,
      name: sp.properties.name,
      address: sp.properties.address,
      count: (sp.properties.waterIds ?? []).filter((id) => clubWaters.has(id)).length,
    }))
    .filter((sp) => sp.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'))
})

const websiteLabel = computed(() => props.club.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))
</script>

<template>
  <article class="detail" :aria-label="`Details ${club.name}`">
    <button type="button" class="back-link" @click="emit('close')">
      <AppIcon name="arrow-left" :size="16" />Alle Gewässer
    </button>

    <header class="detail-header">
      <div class="detail-title">
        <p class="eyebrow">Verein</p>
        <h1 class="serif">{{ club.name }}</h1>
        <p v-if="club.contact" class="subtitle">{{ club.contact }}</p>
      </div>
      <ShareButton :route="{ kind: 'club', id: club.id }" :title="club.name" />
      <button type="button" class="icon-button close-button" aria-label="Schließen" @click="emit('close')">
        <AppIcon name="close" :size="18" :stroke-width="2.2" />
      </button>
    </header>

    <a v-if="club.website" class="website" :href="club.website" target="_blank" rel="noopener">
      {{ websiteLabel }}<AppIcon name="external" :size="16" />
    </a>

    <section>
      <div class="list-heading">
        <h2 class="section-title serif">{{ waters.length }} Gewässer</h2>
        <span v-if="waters.length" class="muted">Gastpreis</span>
      </div>
      <p v-if="!waters.length" class="muted">Noch keine Gewässer erfasst.</p>
      <button
        v-for="water in waters"
        :key="water.id"
        type="button"
        class="water-row"
        @click="emit('selectWater', water.id)"
      >
        <span class="access-dot" :style="{ background: `var(--${water.token})` }" />
        <span class="water-text">
          <span class="water-name">{{ water.name }}</span>
          <span v-if="water.closed" class="water-sub is-closed">{{ planned ? "An dem Tag geschlossen" : "Gerade geschlossen" }}</span>
          <span v-else-if="water.details" class="water-sub">{{ water.details }}</span>
        </span>
        <span v-if="water.membersOnly" class="members-only">nur Mitglieder</span>
        <span v-else class="water-price">{{ water.price }}</span>
      </button>
    </section>

    <section>
      <h2 class="section-title serif">Hier bekommst Du Tageskarten</h2>
      <div v-if="salesPoints.length" class="list-card">
        <button
          v-for="sp in salesPoints"
          :key="sp.id"
          type="button"
          class="list-row"
          @click="emit('selectSalesPoint', sp.id)"
        >
          <span class="row-icon"><AppIcon name="shop" :size="17" /></span>
          <span class="row-text">
            <span class="row-title">{{ sp.name }}</span>
            <span class="row-sub">{{ sp.address }}</span>
            <span class="row-sub">für {{ sp.count }} Gewässer</span>
          </span>
          <AppIcon name="chevron-right" :size="18" class="row-chevron" />
        </button>
      </div>
      <p v-else class="muted">Noch keine Verkaufsstelle erfasst.</p>
    </section>
  </article>
</template>

<style scoped>
.website {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 15px;
  font-weight: 500;
}

.list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.water-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 6px 0;
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

.water-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.water-sub {
  font-size: 13px;
  color: var(--text-2);
}

.water-sub.is-closed {
  color: var(--closed-text);
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
  white-space: nowrap;
}
</style>
