<script setup lang="ts">
import { computed } from 'vue'
import AccessBadge from '@/components/AccessBadge.vue'
import AppIcon from '@/components/AppIcon.vue'
import FavouriteButton from '@/components/FavouriteButton.vue'
import ShareButton from '@/components/ShareButton.vue'
import { IMPRINT, PRICE_LABELS } from '@/config'
import { routeHash } from '@/composables/useHashRoute'
import type { MapData, SalesPointFeature, WaterFeature } from '@/types'
import { ACCESS_POINT_LABELS, accessPointsOf, directionsUrl, routePoint, toLatLng } from '@/utils/access'
import { formatDate, formatDepth, formatPrice } from '@/utils/format'
import { describeUpcoming, isoDay, pricesOn } from '@/utils/prices'
import { reportMailto } from '@/utils/report'
import { formatClock, sunTimes } from '@/utils/sun'
import { holidayOptions } from '@/utils/holidays'
import { availability, describeDayHours, describeOpeningStatus, formatRange, hoursOnDay, openingStatus } from '@/utils/time'

const props = withDefaults(
  defineProps<{
    water: WaterFeature
    data: MapData
    /** Injected for tests, or the planned day at midnight. */
    now?: Date
    /** Whether `now` is a day the user plans for. Then opening hours cover the whole day. */
    planned?: boolean
    /** Address for error reports, null hides the link. Defaults to the imprint mail. */
    reportEmail?: string | null
  }>(),
  { now: () => new Date(), planned: false },
)

const emit = defineEmits<{ selectSalesPoint: [id: string]; selectClub: [id: string]; close: [] }>()

const p = computed(() => props.water.properties)
const club = computed(() => props.data.clubsById.get(p.value.clubId))

const status = computed(() => availability(p.value.season, p.value.guestPeriod, props.now, props.planned))
// Members-only waters are closed for guests anyway, a "wieder ab" date would be misleading.
const closedReason = computed(() => (p.value.guestAccess === 'membersOnly' ? null : status.value.reason))

const priceList = computed(() => pricesOn(p.value, props.now))

/** Sunrise and sunset at the water on the shown day (today or the planned one), dawn and dusk for the details. */
const sun = computed(() => {
  const { lat, lng } = routePoint(props.water.geometry)
  const times = sunTimes(props.now, lat, lng)
  if (!times) return null
  return {
    text: `Sonne ${formatClock(times.sunrise)} bis ${formatClock(times.sunset)}`,
    title:
      `Sonnenaufgang ${formatClock(times.sunrise)} Uhr, Sonnenuntergang ${formatClock(times.sunset)} Uhr. ` +
      `Hell genug ab ${formatClock(times.dawn)} Uhr und bis ${formatClock(times.dusk)} Uhr.`,
  }
})

const priceTiles = computed(() => {
  const prices = priceList.value.current
  if (!prices) return []
  return (Object.keys(PRICE_LABELS) as (keyof typeof PRICE_LABELS)[]).flatMap((key) => {
    const value = prices[key]
    return typeof value === 'number' ? [{ key, label: PRICE_LABELS[key], value }] : []
  })
})

const priceNotes = computed(() => {
  const prices = priceList.value.current
  if (!prices) return []
  const notes: string[] = []
  if (typeof prices.deposit === 'number') notes.push(`Plus ${formatPrice(prices.deposit)} Pfand pro Karte.`)
  // Only worth saying while the date lies ahead, e.g. a new list without the old one.
  const validFrom = formatDate(prices.validFrom)
  if (validFrom && prices.validFrom! > isoDay(props.now)) notes.push(`Preise gültig ab ${validFrom}.`)
  if (prices.note) notes.push(prices.note)
  return notes
})

const upcomingPrices = computed(() =>
  priceList.value.upcoming ? describeUpcoming(priceList.value.upcoming) : null,
)

const salesPoints = computed(() =>
  (props.data.salesPointIdsByWater.get(p.value.id) ?? [])
    .map((id) => props.data.salesPointsById.get(id))
    .filter((sp): sp is SalesPointFeature => Boolean(sp))
    .map((sp) => {
      const rules = sp.properties.openingHours
      const holidays = holidayOptions(sp.properties.address)
      if (rules && props.planned) {
        const day = hoursOnDay(rules, props.now, holidays)
        return {
          id: sp.properties.id,
          name: sp.properties.name,
          address: sp.properties.address,
          openingLabel: day.open === null ? null : day.open ? 'Geöffnet' : 'Geschlossen',
          openingModifier: day.open === null ? 'is-unknown' : day.open ? 'is-open' : 'is-closed',
          openingText: describeDayHours(day),
        }
      }
      const opening = rules ? openingStatus(rules, props.now, holidays) : null
      return {
        id: sp.properties.id,
        name: sp.properties.name,
        address: sp.properties.address,
        // Holidays without holiday hours have no "Geöffnet" or "Geschlossen", only the text.
        openingLabel: !opening || opening.open === null ? null : opening.open ? 'Geöffnet' : 'Geschlossen',
        openingModifier: !opening ? null : opening.open === null ? 'is-unknown' : opening.open ? 'is-open' : 'is-closed',
        openingText: opening ? describeOpeningStatus(opening) : null,
      }
    }),
)

/** Parking and access points with a route link each. */
const places = computed(() =>
  accessPointsOf(props.water).map((point, index) => ({
    key: `${point.type}-${index}`,
    icon: point.type,
    title: point.name ?? ACCESS_POINT_LABELS[point.type],
    // With a name of its own the type still matters, e.g. "Parkplatz" below "Am Nordufer".
    sub: [point.name ? ACCESS_POINT_LABELS[point.type] : null, point.note].filter(Boolean).join(', '),
    href: directionsUrl(toLatLng(point.coordinates)),
  })),
)

/** Without known parking the route leads to the water itself. */
const waterRoute = computed(() => ({
  href: directionsUrl(routePoint(props.water.geometry)),
  sub: props.water.geometry.type.includes('LineString')
    ? 'Noch kein Parkplatz erfasst. Die Route führt zur Mitte der Strecke.'
    : 'Noch kein Parkplatz erfasst. Die Route führt zur Mitte des Sees.',
}))

const lastChecked = computed(() => formatDate(p.value.lastChecked))
const hasRules = computed(() => p.value.rules.length > 0 || Boolean(p.value.seasonNote))
const hasClubInfo = computed(() => Boolean(club.value?.website || club.value?.contact))

const reportHref = computed(() => {
  const email = props.reportEmail === undefined ? (IMPRINT?.email ?? null) : props.reportEmail
  if (!email) return null
  const pageUrl = `${window.location.origin}${window.location.pathname}${routeHash({ kind: 'water', id: p.value.id })}`
  return reportMailto(email, p.value, pageUrl)
})
</script>

<template>
  <article class="detail" :aria-label="`Details ${p.name}`">
    <button type="button" class="back-link" @click="emit('close')">
      <AppIcon name="arrow-left" :size="16" />Alle Gewässer
    </button>

    <header class="detail-header">
      <div class="detail-title">
        <h1 class="serif">{{ p.name }}</h1>
        <p class="subtitle">
          <button v-if="club" type="button" class="club-link" @click="emit('selectClub', club.id)">
            {{ club.name }}<AppIcon name="chevron-right" :size="16" />
          </button>
          <template v-else>Verein unbekannt</template>
        </p>
      </div>
      <FavouriteButton :water-id="p.id" :name="p.name" />
      <ShareButton :route="{ kind: 'water', id: p.id }" :title="p.name" />
      <button type="button" class="icon-button close-button" aria-label="Schließen" @click="emit('close')">
        <AppIcon name="close" :size="18" :stroke-width="2.2" />
      </button>
    </header>

    <div class="badges">
      <AccessBadge :access="p.guestAccess" />
      <span v-if="p.season" class="info-badge"><AppIcon name="calendar" :size="15" />Saison {{ formatRange(p.season) }}</span>
      <span v-if="p.guestPeriod" class="info-badge">
        <AppIcon name="calendar" :size="15" />Gäste {{ formatRange(p.guestPeriod) }}
      </span>
      <span v-if="sun" class="info-badge sun-badge" :title="sun.title">
        <AppIcon name="sun" :size="15" /><span class="sun-text" aria-hidden="true">{{ sun.text }}</span
        ><span class="visually-hidden">{{ sun.title }}</span>
      </span>
      <span v-if="p.maxDepth" class="info-badge"><AppIcon name="depth" :size="15" />bis {{ formatDepth(p.maxDepth) }} tief</span>
      <a v-if="p.depthMapUrl" class="info-badge is-link" :href="p.depthMapUrl" target="_blank" rel="noopener">
        Tiefenkarte<AppIcon name="external" :size="14" />
      </a>
    </div>

    <div v-if="p.warning" class="notice is-alert" role="alert">
      <AppIcon name="info" :size="20" class="notice-icon" />
      <span>
        <strong>{{ p.warning.text }}</strong>
        <template v-if="p.warning.url">
          {{ ' ' }}<a :href="p.warning.url" target="_blank" rel="noopener">Mehr dazu</a>
        </template>
      </span>
    </div>

    <div v-if="closedReason || p.accessNote" class="notice" :class="{ 'is-warning': closedReason }">
      <AppIcon :name="closedReason ? 'clock' : 'member'" :size="20" class="notice-icon" />
      <span>
        <template v-if="closedReason">{{ closedReason }}</template>
        <template v-if="closedReason && p.accessNote">{{ ' ' }}</template>
        <template v-if="p.accessNote">{{ p.accessNote }}</template>
      </span>
    </div>

    <section aria-label="Preise">
      <div v-if="priceTiles.length" class="price-grid" :style="{ '--columns': priceTiles.length }">
        <div v-for="tile in priceTiles" :key="tile.key" class="price-tile" :class="{ 'is-main': tile.key === 'guest' }">
          <div class="price-label">{{ tile.label }}</div>
          <div class="price-value">{{ formatPrice(tile.value) }}</div>
        </div>
      </div>
      <p v-else class="muted">Preise noch nicht erfasst.</p>
      <p v-if="priceNotes.length" class="muted price-note">{{ priceNotes.join(' ') }}</p>
      <p v-if="upcomingPrices" class="upcoming-prices">{{ upcomingPrices }}</p>
    </section>

    <a
      v-if="p.onlinePurchase?.url"
      class="primary-action"
      :href="p.onlinePurchase.url"
      target="_blank"
      rel="noopener"
    >
      Online kaufen bei {{ p.onlinePurchase.provider ?? 'Online-Shop' }}
      <AppIcon name="external" :size="18" />
    </a>

    <section>
      <h2 :class="p.onlinePurchase?.url ? 'section-label' : 'section-title serif'">
        {{ p.onlinePurchase?.url ? 'Oder vor Ort' : 'Hier bekommst Du die Karte' }}
      </h2>
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
            <span v-if="sp.openingText" class="row-sub" :class="sp.openingModifier">
              <template v-if="sp.openingLabel">{{ sp.openingLabel }}, {{ sp.openingText }}</template>
              <template v-else>{{ sp.openingText.charAt(0).toUpperCase() + sp.openingText.slice(1) }}</template>
            </span>
          </span>
          <AppIcon name="chevron-right" :size="18" class="row-chevron" />
        </button>
      </div>
      <p v-else-if="!p.onlinePurchase?.url" class="muted">Noch keine Ausgabestelle erfasst.</p>
    </section>

    <section class="directions">
      <h2 class="section-title serif">Anfahrt</h2>
      <div class="list-card">
        <template v-if="places.length">
          <a v-for="place in places" :key="place.key" class="list-row" :href="place.href" target="_blank" rel="noopener">
            <span class="row-icon is-place"><AppIcon :name="place.icon" :size="17" /></span>
            <span class="row-text">
              <span class="row-title">{{ place.title }}</span>
              <span v-if="place.sub" class="row-sub">{{ place.sub }}</span>
            </span>
            <AppIcon name="route" :size="18" class="row-chevron" />
            <span class="visually-hidden">, Route öffnen</span>
          </a>
        </template>
        <a v-else class="list-row" :href="waterRoute.href" target="_blank" rel="noopener">
          <span class="row-icon is-place"><AppIcon name="route" :size="17" /></span>
          <span class="row-text">
            <span class="row-title">Route zum Gewässer</span>
            <span class="row-sub">{{ waterRoute.sub }}</span>
          </span>
          <AppIcon name="external" :size="18" class="row-chevron" />
        </a>
      </div>
    </section>

    <section v-if="p.species.length">
      <h2 class="section-title serif">Fischarten</h2>
      <div class="chips">
        <span v-for="species in p.species" :key="species" class="chip">{{ species }}</span>
      </div>
    </section>

    <div class="accordion">
      <details v-if="hasRules">
        <summary>Regeln und Besonderheiten<AppIcon name="chevron-down" :size="18" /></summary>
        <ul>
          <li v-if="p.seasonNote">{{ p.seasonNote }}</li>
          <li v-for="rule in p.rules" :key="rule">{{ rule }}</li>
        </ul>
      </details>
      <details v-if="p.closedSeasons.length">
        <summary>Schonzeiten und Mindestmaße<AppIcon name="chevron-down" :size="18" /></summary>
        <ul>
          <li v-for="item in p.closedSeasons" :key="item">{{ item }}</li>
        </ul>
      </details>
      <details v-if="hasClubInfo">
        <summary>Verein und Kontakt<AppIcon name="chevron-down" :size="18" /></summary>
        <p v-if="club?.website">
          <a :href="club.website" target="_blank" rel="noopener">{{ club.website.replace(/^https?:\/\/(www\.)?/, '') }}</a>
        </p>
        <p v-if="club?.contact">{{ club.contact }}</p>
      </details>
    </div>

    <footer class="meta">
      <p v-if="lastChecked">
        <AppIcon name="check" :size="15" />Zuletzt geprüft am {{ lastChecked }}<template v-if="p.source">,
          <a :href="p.source" target="_blank" rel="noopener">Quelle</a></template>
      </p>
      <p v-if="p.geometryStatus === 'placeholder'" class="warning">Die Lage auf der Karte ist nur ungefähr.</p>
      <p v-if="reportHref" class="report">
        <AppIcon name="mail" :size="15" />Etwas stimmt nicht?
        <a :href="reportHref">Fehler melden</a>
      </p>
    </footer>
  </article>
</template>

<style scoped>
.club-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent-text);
  font-size: inherit;
  text-align: left;
  cursor: pointer;
}

.club-link:hover {
  color: var(--text);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 15px;
  background: var(--surface-3);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.info-badge.is-link {
  color: var(--accent-text);
  text-decoration: none;
}

.info-badge.is-link:hover {
  background: var(--accent-soft);
}

.notice {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-3);
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.45;
}

.notice.is-warning {
  background: var(--member-bg);
  color: var(--member-text);
}

.notice.is-alert {
  background: var(--closed-bg);
  color: var(--closed-text);
}

.notice.is-alert a {
  color: inherit;
  font-weight: 600;
}

.notice-icon {
  flex: 0 0 20px;
  margin-top: 1px;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.price-tile {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-3);
}

@media (max-width: 899px) {
  .price-grid {
    gap: 6px;
  }

  .price-tile {
    padding: 8px 10px;
  }

  .price-value {
    font-size: 20px;
  }
}

.price-tile.is-main {
  background: var(--accent-soft);
}

.price-label {
  font-size: 12px;
  color: var(--text-2);
}

.price-value {
  font-size: 22px;
  font-weight: 600;
}

.price-tile.is-main .price-value {
  font-weight: 700;
  color: var(--accent-text);
}

.upcoming-prices {
  margin: 8px 0 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 13px;
  font-weight: 500;
}

.price-note {
  margin: 8px 0 0;
}

.primary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: 14px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}

.primary-action:hover {
  color: var(--on-accent);
  filter: brightness(1.08);
}

.is-open {
  color: var(--open-text);
}

.is-closed {
  color: var(--closed-text);
}

.is-unknown {
  color: var(--unknown-text);
}
</style>
