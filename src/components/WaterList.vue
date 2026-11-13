<script setup lang="ts">
import { computed } from 'vue'
import { GUEST_ACCESS } from '@/config'
import type { MapData } from '@/types'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ data: MapData }>()
const emit = defineEmits<{ selectWater: [id: string] }>()

const waters = computed(() =>
  [...props.data.waters.features]
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'de'))
    .map((water) => {
      const p = water.properties
      const club = props.data.clubsById.get(p.clubId)
      const guest = p.prices?.guest
      return {
        id: p.id,
        name: p.name,
        clubName: club ? (club.shortName ?? club.name) : null,
        token: (GUEST_ACCESS[p.guestAccess] ?? GUEST_ACCESS.unknown).token,
        price: p.guestAccess === 'membersOnly' ? null : typeof guest === 'number' ? formatPrice(guest) : null,
      }
    }),
)
</script>

<template>
  <section class="water-list" aria-label="Alle Gewässer">
    <div>
      <h1 class="serif">Alle Gewässer</h1>
      <p class="muted">
        {{ waters.length }} Gewässer und {{ data.salesPoints.features.length }} Verkaufsstellen. Wähle ein Gewässer auf
        der Karte oder in der Liste.
      </p>
    </div>
    <ul>
      <li v-for="water in waters" :key="water.id">
        <button type="button" class="row" @click="emit('selectWater', water.id)">
          <span class="dot" :style="{ background: `var(--${water.token})` }" />
          <span class="name">
            {{ water.name }}
            <span v-if="water.clubName" class="club">{{ water.clubName }}</span>
          </span>
          <span v-if="water.price" class="price">{{ water.price }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
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

.price {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
