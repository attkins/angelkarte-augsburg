import type { MapData, WaterFeature } from '@/types'
import { holidayOptions } from '@/utils/holidays'
import { availability, openingStatus } from '@/utils/time'

// Filtering for the water list and the map. Pure functions, `now` is a parameter so it is testable.

/** Fixed chips from the design, plus the dynamic `club:<id>` chips built at runtime. */
export type FixedChip = 'guests' | 'online' | 'seasonOpen' | 'ticketToday' | 'flyFishing'

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

/**
 * Whether a ticket can still be bought today: online, or at a sales point that is open now or
 * opens later today. Sales points without known hours, and holidays without holiday hours,
 * do not count, the app cannot promise anything there.
 */
export function canGetTicketToday(water: WaterFeature, data: MapData, now: Date): boolean {
  if (water.properties.onlinePurchase) return true
  return (data.salesPointIdsByWater.get(water.properties.id) ?? []).some((id) => {
    const salesPoint = data.salesPointsById.get(id)?.properties
    if (!salesPoint?.openingHours) return false
    const status = openingStatus(salesPoint.openingHours, now, holidayOptions(salesPoint.address))
    return status.open === true || (status.open === false && status.opensOn === 'today')
  })
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
    if (chip === 'ticketToday' && !canGetTicketToday(water, data, now)) return false
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
