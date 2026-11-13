<script setup lang="ts">
import { computed } from 'vue'
import { GUEST_ACCESS, PRICE_LABELS } from '@/config'
import type { MapData, PriceKey, SalesPointFeature, WaterFeature } from '@/types'
import { formatDate, formatPrice } from '@/utils/format'

const props = defineProps<{
  water: WaterFeature
  data: MapData
}>()

const emit = defineEmits<{ selectSalesPoint: [id: string] }>()

const p = computed(() => props.water.properties)
const club = computed(() => props.data.clubsById.get(p.value.clubId))
const access = computed(() => GUEST_ACCESS[p.value.guestAccess] ?? GUEST_ACCESS.unknown)

const priceRows = computed(() => {
  const prices = p.value.prices
  if (!prices) return []
  return (Object.keys(PRICE_LABELS) as PriceKey[]).flatMap((key) => {
    const value = prices[key]
    return typeof value === 'number' ? [{ key, label: PRICE_LABELS[key], value }] : []
  })
})

const salesPoints = computed(() =>
  (props.data.salesPointIdsByWater.get(p.value.id) ?? [])
    .map((id) => props.data.salesPointsById.get(id))
    .filter((sp): sp is SalesPointFeature => Boolean(sp)),
)

const hasDetails = computed(
  () =>
    p.value.rules.length > 0 ||
    p.value.closedSeasons.length > 0 ||
    Boolean(club.value?.website) ||
    Boolean(club.value?.contact),
)

const lastChecked = computed(() => formatDate(p.value.lastChecked))
const pricesValidFrom = computed(() => formatDate(p.value.prices?.validFrom))
</script>

<template>
  <div class="popup">
    <h3>{{ p.name }}</h3>
    <p class="club">{{ club?.name ?? 'Verein unbekannt' }}</p>
    <span class="access" :style="{ background: access.color }">{{ access.label }}</span>
    <p v-if="p.accessNote" class="note">{{ p.accessNote }}</p>
    <p v-if="p.season" class="note">Saison: {{ p.season }}</p>

    <template v-if="priceRows.length">
      <table class="prices">
        <tbody>
          <tr v-for="row in priceRows" :key="row.key">
            <td>{{ row.label }}</td>
            <td>{{ formatPrice(row.value) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="pricesValidFrom" class="note">Preise gültig ab {{ pricesValidFrom }}.</p>
      <p v-if="p.prices?.note" class="note">{{ p.prices.note }}</p>
    </template>
    <p v-else class="note">Preise noch nicht erfasst.</p>

    <h4>Tageskarten bei</h4>
    <ul v-if="salesPoints.length || p.onlinePurchase?.url">
      <li v-for="sp in salesPoints" :key="sp.properties.id">
        <button type="button" class="link" @click="emit('selectSalesPoint', sp.properties.id)">
          {{ sp.properties.name }}
        </button>
      </li>
      <li v-if="p.onlinePurchase?.url">
        Online:
        <a :href="p.onlinePurchase.url" target="_blank" rel="noopener">
          {{ p.onlinePurchase.provider ?? 'online' }}
        </a>
      </li>
    </ul>
    <p v-else class="note">Noch keine Ausgabestelle erfasst.</p>

    <template v-if="p.species.length">
      <h4>Fischarten</h4>
      <p>{{ p.species.join(', ') }}</p>
    </template>

    <details v-if="hasDetails">
      <summary>Mehr Infos</summary>
      <template v-if="p.rules.length">
        <h4>Regeln</h4>
        <ul>
          <li v-for="rule in p.rules" :key="rule">{{ rule }}</li>
        </ul>
      </template>
      <template v-if="p.closedSeasons.length">
        <h4>Schonzeiten und Mindestmaße</h4>
        <ul>
          <li v-for="season in p.closedSeasons" :key="season">{{ season }}</li>
        </ul>
      </template>
      <template v-if="club?.website">
        <h4>Verein</h4>
        <p><a :href="club.website" target="_blank" rel="noopener">{{ club.website }}</a></p>
      </template>
      <p v-if="club?.contact">{{ club.contact }}</p>
    </details>

    <p v-if="lastChecked" class="meta">
      Zuletzt geprüft am {{ lastChecked }}<template v-if="p.source">,
        <a :href="p.source" target="_blank" rel="noopener">Quelle</a></template>
    </p>
    <p v-if="p.geometryStatus === 'placeholder'" class="warning">Umriss ist nur ein Platzhalter.</p>
  </div>
</template>
