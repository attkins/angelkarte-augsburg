import type { MapData, WaterFeature } from '@/types'
import { holidayOptions } from '@/utils/holidays'
import { hasSpecies } from '@/utils/species'
import { availability, hoursOnDay, openingStatus } from '@/utils/time'

// Filtering for the water list and the map. Pure functions, `now` is a parameter so it is testable.

/** Fixed chips from the design. Club and fish species are separate selects. */
export type FixedChip = 'favourites' | 'guests' | 'online' | 'seasonOpen' | 'ticketToday' | 'flyFishing'

export interface WaterFilter {
  /** Free text, matched against water and club name. */
  search: string
  /** Active fixed chips. */
  chips: Set<FixedChip>
  /** Active club id, or null for all clubs. */
  clubId: string | null
  /** Active fish species as offered by `speciesOptions`, or null for all species. */
  species: string | null
}

export function emptyFilter(): WaterFilter {
  return { search: '', chips: new Set(), clubId: null, species: null }
}

export function isFilterActive(filter: WaterFilter): boolean {
  return (
    filter.search.trim() !== '' || filter.chips.size > 0 || filter.clubId !== null || filter.species !== null
  )
}

function isFlyFishing(water: WaterFeature): boolean {
  return water.properties.rules.some((r) => r.toLowerCase().includes('fliegen'))
}

/**
 * Whether a ticket can still be bought today, or on the planned day when `planned` is set: online, or at a sales point that is open now or
 * opens later today. Sales points without known hours, and holidays without holiday hours,
 * do not count, the app cannot promise anything there.
 */
export function canGetTicketToday(water: WaterFeature, data: MapData, now: Date, planned = false): boolean {
  if (water.properties.onlinePurchase) return true
  return (data.salesPointIdsByWater.get(water.properties.id) ?? []).some((id) => {
    const salesPoint = data.salesPointsById.get(id)?.properties
    if (!salesPoint?.openingHours) return false
    // A planned day counts as a whole, no matter what time it is now.
    if (planned) return hoursOnDay(salesPoint.openingHours, now, holidayOptions(salesPoint.address)).open === true
    const status = openingStatus(salesPoint.openingHours, now, holidayOptions(salesPoint.address))
    return status.open === true || (status.open === false && status.opensOn === 'today')
  })
}

function matches(
  water: WaterFeature,
  data: MapData,
  filter: WaterFilter,
  now: Date,
  planned: boolean,
  favourites: ReadonlySet<string>,
): boolean {
  const p = water.properties

  if (filter.clubId && p.clubId !== filter.clubId) return false
  if (filter.species && !hasSpecies(water, filter.species)) return false

  const search = filter.search.trim().toLowerCase()
  if (search) {
    const club = data.clubsById.get(p.clubId)
    const haystack = `${p.name} ${club?.name ?? ''} ${club?.shortName ?? ''}`.toLowerCase()
    if (!haystack.includes(search)) return false
  }

  for (const chip of filter.chips) {
    if (chip === 'favourites' && !favourites.has(p.id)) return false
    if (chip === 'guests' && p.guestAccess !== 'open') return false
    if (chip === 'online' && !p.onlinePurchase) return false
    if (chip === 'flyFishing' && !isFlyFishing(water)) return false
    if (chip === 'seasonOpen' && !availability(p.season, p.guestPeriod, now, planned).openForGuestsToday) return false
    if (chip === 'ticketToday' && !canGetTicketToday(water, data, now, planned)) return false
  }

  return true
}

/**
 * Ids of the waters that pass the filter. `planned` means `now` is a planned day, not this moment.
 * `favourites` are the waters the user starred, used by the chip "Meine Gewässer".
 */
export function matchingWaterIds(
  data: MapData,
  filter: WaterFilter,
  now: Date,
  planned = false,
  favourites: ReadonlySet<string> = new Set(),
): Set<string> {
  const ids = new Set<string>()
  for (const water of data.waters.features) {
    if (matches(water, data, filter, now, planned, favourites)) ids.add(water.properties.id)
  }
  return ids
}
