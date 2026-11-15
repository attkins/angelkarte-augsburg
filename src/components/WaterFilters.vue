<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { MapData } from '@/types'
import { type FixedChip, isFilterActive, type WaterFilter } from '@/utils/filter'

const props = defineProps<{ data: MapData; filter: WaterFilter; count: number }>()
const emit = defineEmits<{ selectClub: [id: string] }>()

const CHIPS: { key: FixedChip; label: string }[] = [
  { key: 'guests', label: 'Gäste willkommen' },
  { key: 'online', label: 'Online buchbar' },
  { key: 'seasonOpen', label: 'Saison offen' },
  { key: 'ticketToday', label: 'Karte heute noch' },
  { key: 'flyFishing', label: 'Fliegenfischen' },
]

// Only clubs that actually have waters, sorted by their displayed name.
const clubs = computed(() => {
  const withWaters = new Set(props.data.waters.features.map((f) => f.properties.clubId))
  return props.data.clubs
    .filter((c) => withWaters.has(c.id))
    .map((c) => ({ id: c.id, name: c.shortName ?? c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
})

const active = computed(() => isFilterActive(props.filter))

function toggleChip(key: FixedChip) {
  if (props.filter.chips.has(key)) props.filter.chips.delete(key)
  else props.filter.chips.add(key)
}

function reset() {
  props.filter.search = ''
  props.filter.chips.clear()
  props.filter.clubId = null
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

    <div class="chips" role="group" aria-label="Filter">
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
      <span>{{ count }} {{ count === 1 ? 'Gewässer' : 'Gewässer' }}</span>
      <button type="button" class="reset" @click="reset">
        <AppIcon name="close" :size="14" :stroke-width="2" /> Filter zurücksetzen
      </button>
    </div>
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

.club-select {
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
}

.club-select.is-active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
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
</style>
