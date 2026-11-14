import type { MapData, WaterFeature } from '@/types'
import { availability } from '@/utils/time'

// Filtering for the water list and the map. Pure functions, `now` is a parameter so it is testable.

/** Fixed chips from the design, plus the dynamic `club:<id>` chips built at runtime. */
export type FixedChip = 'guests' | 'online' | 'seasonOpen' | 'flyFishing'

export interface WaterFilter {
  /** Free text, matched against water and club name. */
  search: string
  /** Active fixed chips. */
  chips: Set<FixedChip>
  /** Active club id, or null for all clubs. */
  clubId: string | null
}

export function emptyFilter(): WaterFilter {
  return { search: '', chips: new Set(), clubId: null }
}

export function isFilterActive(filter: WaterFilter): boolean {
  return filter.search.trim() !== '' || filter.chips.size > 0 || filter.clubId !== null
}

function isFlyFishing(water: WaterFeature): boolean {
  return water.properties.rules.some((r) => r.toLowerCase().includes('fliegen'))
}

function matches(water: WaterFeature, data: MapData, filter: WaterFilter, now: Date): boolean {
  const p = water.properties

  if (filter.clubId && p.clubId !== filter.clubId) return false

  const search = filter.search.trim().toLowerCase()
  if (search) {
    const club = data.clubsById.get(p.clubId)
    const haystack = `${p.name} ${club?.name ?? ''} ${club?.shortName ?? ''}`.toLowerCase()
    if (!haystack.includes(search)) return false
  }

  for (const chip of filter.chips) {
    if (chip === 'guests' && p.guestAccess !== 'open') return false
    if (chip === 'online' && !p.onlinePurchase) return false
    if (chip === 'flyFishing' && !isFlyFishing(water)) return false
    if (chip === 'seasonOpen' && !availability(p.season, p.guestPeriod, now).openForGuestsToday) return false
  }

  return true
}

/** Ids of the waters that pass the filter. */
export function matchingWaterIds(data: MapData, filter: WaterFilter, now: Date): Set<string> {
  const ids = new Set<string>()
  for (const water of data.waters.features) {
    if (matches(water, data, filter, now)) ids.add(water.properties.id)
  }
  return ids
}
