<script setup lang="ts">
import { computed } from 'vue'
import type { MapData, SalesPointFeature, WaterFeature } from '@/types'
import { phoneHref } from '@/utils/format'

const props = defineProps<{
  salesPoint: SalesPointFeature
  data: MapData
}>()

const emit = defineEmits<{ selectWater: [id: string] }>()

const p = computed(() => props.salesPoint.properties)

const waters = computed(() =>
  (p.value.waterIds ?? [])
    .map((id) => props.data.watersById.get(id))
    .filter((water): water is WaterFeature => Boolean(water))
    .map((water) => {
      const club = props.data.clubsById.get(water.properties.clubId)
      return {
        id: water.properties.id,
        name: water.properties.name,
        clubName: club ? (club.shortName ?? club.name) : null,
      }
    }),
)
</script>

<template>
  <div class="popup">
    <h3>{{ p.name }}</h3>
    <p class="club">{{ p.address }}</p>
    <p v-if="p.phone">Telefon: <a :href="phoneHref(p.phone)">{{ p.phone }}</a></p>
    <p v-if="p.openingHours">Öffnungszeiten: {{ p.openingHours }}</p>

    <h4>Tageskarten für</h4>
    <ul v-if="waters.length">
      <li v-for="water in waters" :key="water.id">
        <button type="button" class="link" @click="emit('selectWater', water.id)">
          {{ water.name }}
        </button>
        <template v-if="water.clubName"> ({{ water.clubName }})</template>
      </li>
    </ul>
    <p v-else class="note">Noch keine Gewässer zugeordnet.</p>

    <p v-if="p.coordinatesApproximate" class="warning">Position ist nur ungefähr.</p>
  </div>
</template>
