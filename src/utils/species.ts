import type { WaterFeature } from '@/types'

// Fish species as offered in the filter. The data keeps the names the sources use, this module
// maps them onto the names an angler picks from: all trout variants are "Forelle", Aitel is
// "Döbel", Waller is "Wels" and so on.

/** Data names that map onto another filter name. Anything not listed maps onto itself. */
const ALIASES: Record<string, string> = {
  Bachforelle: 'Forelle',
  Regenbogenforelle: 'Forelle',
  Seeforelle: 'Forelle',
  Lachsforelle: 'Forelle',
  // Sources write "Salmoniden" for stocked trout waters, so it counts as trout.
  Salmoniden: 'Forelle',
  Bachsaibling: 'Saibling',
  Seesaibling: 'Saibling',
  'Aitel (Döbel)': 'Döbel',
  Aitel: 'Döbel',
  Waller: 'Wels',
  Amur: 'Graskarpfen',
  Barsch: 'Flussbarsch',
  Brachsen: 'Brachse',
  Aalrutte: 'Rutte',
  Weißfisch: 'Weißfische',
}

/** Small fish nobody targets (some are protected). They stay in the detail view but are not offered as a filter. */
const NOT_OFFERED = new Set(['Elritze', 'Koppe', 'Mühlkoppe', 'Schmerle'])

/** Filter name for a species name from the data, or null if it is not offered in the filter. */
export function speciesGroup(name: string): string | null {
  const trimmed = name.trim()
  if (NOT_OFFERED.has(trimmed)) return null
  return ALIASES[trimmed] ?? trimmed
}

/** Whether a water lists a species that belongs to the given filter name. */
export function hasSpecies(water: WaterFeature, group: string): boolean {
  return water.properties.species.some((s) => speciesGroup(s) === group)
}

/** Filter names that occur in the given waters, sorted alphabetically. */
export function speciesOptions(waters: readonly WaterFeature[]): string[] {
  const groups = new Set<string>()
  for (const water of waters) {
    for (const s of water.properties.species) {
      const group = speciesGroup(s)
      if (group) groups.add(group)
    }
  }
  return [...groups].sort((a, b) => a.localeCompare(b, 'de'))
}
