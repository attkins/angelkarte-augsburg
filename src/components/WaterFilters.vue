<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useFavourites } from '@/composables/useFavourites'
import type { MapData } from '@/types'
import { type FixedChip, isFilterActive, type WaterFilter } from '@/utils/filter'
import { isoDay } from '@/utils/prices'
import { speciesOptions } from '@/utils/species'

const props = defineProps<{ data: MapData; filter: WaterFilter; count: number }>()
const emit = defineEmits<{ selectClub: [id: string] }>()

/** Planned day as ISO date, null for today. */
const planDay = defineModel<string | null>('planDay', { default: null })

/** Today as ISO date, the earliest day that can be planned. */
const today = isoDay(new Date())

const { favourites } = useFavourites()

/** "Meine Gewässer" only makes sense once something is starred, or while it is switched on. */
const showFavourites = computed(() => favourites.value.size > 0 || props.filter.chips.has('favourites'))

const CHIPS = computed<{ key: FixedChip; label: string }[]>(() => [
  { key: 'guests', label: 'Gäste willkommen' },
  { key: 'online', label: 'Online buchbar' },
  { key: 'seasonOpen', label: 'Saison offen' },
  { key: 'ticketToday', label: planDay.value ? 'Karte an dem Tag' : 'Karte heute noch' },
  { key: 'flyFishing', label: 'Fliegenfischen' },
])

function changeDay(event: Event) {
  const value = (event.target as HTMLInputElement).value
  // An emptied field or today itself both mean "now".
  planDay.value = value && value > today ? value : null
}

// Only clubs that actually have waters, sorted by their displayed name.
const clubs = computed(() => {
  const withWaters = new Set(props.data.waters.features.map((f) => f.properties.clubId))
  return props.data.clubs
    .filter((c) => withWaters.has(c.id))
    .map((c) => ({ id: c.id, name: c.shortName ?? c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
})

const species = computed(() => speciesOptions(props.data.waters.features))

const active = computed(() => isFilterActive(props.filter))

function toggleChip(key: FixedChip) {
  if (props.filter.chips.has(key)) props.filter.chips.delete(key)
  else props.filter.chips.add(key)
}

function reset() {
  props.filter.search = ''
  props.filter.chips.clear()
  props.filter.clubId = null
  props.filter.species = null
}
</script>

<template>
  <section class="filters" aria-label="Gewässer filtern">
    <div class="search">
      <AppIcon name="fish" :size="18" :stroke-width="1.8" />
      <input
        v-model="props.filter.search"
        type="search"
        placeholder="Gewässer oder Verein suchen"
        aria-label="Gewässer oder Verein suchen"
      />
    </div>

    <div class="date-row">
      <label class="chip date-chip" :class="{ 'is-active': planDay !== null }">
        <AppIcon name="calendar" :size="15" />
        <span class="visually-hidden">Datum planen</span>
        <input type="date" :value="planDay ?? today" :min="today" @change="changeDay" />
      </label>
      <button v-if="planDay" type="button" class="chip" @click="planDay = null">Heute</button>
      <span v-else class="date-hint">Für einen anderen Tag planen</span>
    </div>

    <div class="chips" role="group" aria-label="Filter">
      <button
        v-if="showFavourites"
        type="button"
        class="chip favourites-chip"
        :class="{ 'is-active': props.filter.chips.has('favourites') }"
        :aria-pressed="props.filter.chips.has('favourites')"
        @click="toggleChip('favourites')"
      >
        <AppIcon name="star-filled" :size="13" />Meine Gewässer
      </button>
      <button
        v-for="chip in CHIPS"
        :key="chip.key"
        type="button"
        class="chip"
        :class="{ 'is-active': props.filter.chips.has(chip.key) }"
        :aria-pressed="props.filter.chips.has(chip.key)"
        @click="toggleChip(chip.key)"
      >
        {{ chip.label }}
      </button>

      <select
        v-model="props.filter.clubId"
        class="chip club-select"
        :class="{ 'is-active': props.filter.clubId !== null }"
        aria-label="Verein"
      >
        <option :value="null">Alle Vereine</option>
        <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
      </select>
      <select
        v-if="species.length"
        v-model="props.filter.species"
        class="chip species-select"
        :class="{ 'is-active': props.filter.species !== null }"
        aria-label="Fischart"
      >
        <option :value="null">Alle Fischarten</option>
        <option v-for="name in species" :key="name" :value="name">{{ name }}</option>
      </select>
      <button
        v-if="props.filter.clubId"
        type="button"
        class="chip club-page"
        @click="emit('selectClub', props.filter.clubId)"
      >
        Zum Verein<AppIcon name="chevron-right" :size="14" />
      </button>
    </div>

    <div v-if="active" class="result-row">
      <span>{{ count }} Gewässer</span>
      <button type="button" class="reset" @click="reset">
        <AppIcon name="close" :size="14" :stroke-width="2" /> Filter zurücksetzen
      </button>
    </div>
    <p v-if="props.filter.species" class="species-hint">
      Fischarten sind nicht für alle Gewässer erfasst. Gewässer ohne Angabe fehlen hier.
    </p>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--text-2);
}

.search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 15px;
}

.search input::placeholder {
  color: var(--text-2);
}

.search input:focus {
  outline: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 17px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

.favourites-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.favourites-chip:not(.is-active) svg {
  color: var(--accent);
}

.chip:hover {
  border-color: var(--accent);
}

.chip.is-active {
  border-color: var(--accent);
  background-color: var(--accent);
  color: var(--on-accent);
}

.club-page {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.club-select,
.species-select {
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
}

.club-select.is-active,
.species-select.is-active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-2);
}

.species-hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-2);
}

.reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 0;
  background: none;
  color: var(--accent-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.date-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.date-chip input {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  color-scheme: light dark;
}

.date-hint {
  font-size: 13px;
  color: var(--text-2);
}
</style>
