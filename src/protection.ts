import { legalRegionOf } from '@/legal'
import type { DateRange, MonthDay, WaterFeature } from '@/types'
import { speciesGroup } from '@/utils/species'
import { isInRange } from '@/utils/time'

// Legal closed seasons and minimum sizes for the species in our data. Clubs may set stricter rules,
// those stay in `closedSeasons` of the water. Checked against the sources below, update `checked`
// when you check again. Only the rows for the Danube basin are taken for Bavaria, all our Bavarian
// waters drain into the Danube.

export interface SpeciesRule {
  /** Closed season, both ends inclusive. Missing when there is none. */
  closed?: DateRange
  /** Protected all year, must always be put back. */
  allYear?: boolean
  /** Minimum size in cm, measured from the tip of the head to the end of the tail fin. */
  minSize?: number
  /** Extra condition shown with the rule. */
  note?: string
}

export interface ProtectionArea {
  /** "in Bayern", "in Tirol", used in texts. */
  label: string
  rules: Record<string, SpeciesRule>
  sources: { label: string; url: string }[]
  /** ISO date of the last check against the sources. */
  checked: string
}

/** No closed season and no minimum size, listed so the detail can say so. */
const FREE: SpeciesRule = {}

/** AVBayFiG Anlage (valid from 1.6.2025), rows valid in the Danube basin (D). */
const BAVARIA: Record<string, SpeciesRule> = {
  Äsche: { closed: { from: '01-01', to: '04-30' }, minSize: 35 },
  Bachforelle: { closed: { from: '10-01', to: '03-15' }, minSize: 26 },
  Barbe: { closed: { from: '05-01', to: '06-30' }, minSize: 40 },
  Elritze: { closed: { from: '05-01', to: '06-30' } },
  Hasel: { closed: { from: '03-01', to: '04-30' } },
  Hecht: { closed: { from: '02-15', to: '04-30' }, minSize: 50 },
  Huchen: { closed: { from: '02-15', to: '06-30' }, minSize: 90 },
  Karpfen: { minSize: 35 },
  Koppe: { closed: { from: '02-01', to: '04-30' } },
  Nase: { closed: { from: '03-01', to: '04-30' }, minSize: 30 },
  Nerfling: { closed: { from: '03-01', to: '04-30' }, minSize: 30 },
  Regenbogenforelle: { closed: { from: '12-15', to: '03-15' }, minSize: 26 },
  Renke: { closed: { from: '10-15', to: '12-31' }, minSize: 30 },
  Rutte: { minSize: 40 },
  Rapfen: { closed: { from: '03-01', to: '04-30' }, minSize: 40 },
  Schleie: { closed: { from: '05-01', to: '06-30' }, minSize: 26 },
  Seeforelle: { closed: { from: '10-01', to: '03-15' }, minSize: 60 },
  Seesaibling: { closed: { from: '10-01', to: '12-31' }, minSize: 30 },
  Zander: { closed: { from: '02-15', to: '04-30' }, minSize: 50 },
  Karausche: { allYear: true },
  Aal: FREE,
  Bachsaibling: FREE,
  Brachse: FREE,
  Döbel: FREE,
  Flussbarsch: FREE,
  Giebel: FREE,
  Laube: FREE,
  Rotauge: FREE,
  Rotfeder: FREE,
  Wels: FREE,
}

/** Bezirksfischereiverordnung Schwaben (2023 to 2027), the parts that touch our waters. */
const SWABIA: Record<string, SpeciesRule> = {
  ...BAVARIA,
  Aal: { minSize: 50 },
  Seeforelle: {
    ...BAVARIA.Seeforelle,
    note: 'In Baggerseen ohne Verbindung zu anderen Gewässern gelten 45 cm und Schonzeit bis 15.3.',
  },
}

/** Tiroler Fischereiverordnung, Anlage 9 (Brittelmaße) and Anlage 10 (Schonzeiten). */
const TYROL: Record<string, SpeciesRule> = {
  Rutte: { closed: { from: '12-01', to: '03-31' }, minSize: 35 },
  Äsche: { closed: { from: '01-01', to: '05-15' }, minSize: 42 },
  Barbe: { closed: { from: '05-01', to: '06-15' }, minSize: 40 },
  Brachse: { closed: { from: '05-01', to: '05-31' }, minSize: 25 },
  Elritze: { closed: { from: '04-01', to: '06-15' } },
  Bachforelle: { closed: { from: '10-01', to: '02-28' }, minSize: 25 },
  Regenbogenforelle: { minSize: 30 },
  Seeforelle: { closed: { from: '10-01', to: '12-31' }, minSize: 50 },
  Hecht: { closed: { from: '03-01', to: '04-30' }, minSize: 50 },
  Huchen: { closed: { from: '03-01', to: '05-31' }, minSize: 80 },
  Karpfen: { minSize: 35 },
  Laube: { closed: { from: '05-01', to: '06-30' } },
  Nase: { closed: { from: '03-15', to: '05-31' }, minSize: 40 },
  Renke: { closed: { from: '11-01', to: '01-31' }, minSize: 30 },
  Rotauge: { closed: { from: '04-01', to: '05-31' } },
  Rotfeder: { closed: { from: '04-01', to: '05-31' } },
  Bachsaibling: { closed: { from: '10-01', to: '03-15' }, minSize: 22 },
  Seesaibling: { closed: { from: '10-01', to: '02-28' }, minSize: 25 },
  Schleie: { closed: { from: '05-15', to: '06-30' }, minSize: 30 },
  Wels: { closed: { from: '06-01', to: '06-30' } },
  Zander: { closed: { from: '04-01', to: '05-31' }, minSize: 45 },
  Hasel: { allYear: true },
  Koppe: { allYear: true },
  Nerfling: { allYear: true },
  Rapfen: { allYear: true },
  Schmerle: { allYear: true },
  // Not in the Tyrolean lists, so neither closed season nor minimum size.
  Aal: FREE,
  Döbel: FREE,
  Flussbarsch: FREE,
  Karausche: FREE,
}

const BAVARIAN_SOURCES = [
  { label: 'AVBayFiG, Anlage', url: 'https://www.gesetze-bayern.de/Content/Document/BayAVFiG-ANL_1' },
]

export const PROTECTION = {
  swabia: {
    label: 'in Schwaben',
    rules: SWABIA,
    sources: [
      ...BAVARIAN_SOURCES,
      { label: 'Bezirksfischereiverordnung Schwaben', url: 'https://www.bezirk-schwaben.de/media/1435/bezfivo2023-schwaben.pdf' },
    ],
    checked: '2026-11-19',
  },
  upperBavaria: { label: 'in Oberbayern', rules: BAVARIA, sources: BAVARIAN_SOURCES, checked: '2026-11-19' },
  tyrol: {
    label: 'in Tirol',
    rules: TYROL,
    sources: [
      {
        label: 'Tiroler Fischereiverordnung',
        url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrT&Gesetzesnummer=20000862',
      },
    ],
    checked: '2026-11-19',
  },
} satisfies Record<string, ProtectionArea>

export type ProtectionAreaId = keyof typeof PROTECTION

/**
 * Bavarian waters in Upper Bavaria (Landkreise Landsberg am Lech and Neuburg-Schrobenhausen), looked up
 * in OSM on 2026-11-19. All other Bavarian waters are in Swabia. A new water near the Lech or the Paar
 * east of Augsburg may belong here, check its Landkreis.
 */
export const UPPER_BAVARIA_WATERS = new Set([
  'fva-auensee',
  'fgb-hurlacher-see',
  'fgb-altoettinger-weiher',
  'lfv-paar-4',
  'lwfv-lech-scheuring',
  'pfk-verlorener-bach',
])

export function protectionAreaOf(water: WaterFeature): ProtectionAreaId {
  if (legalRegionOf(water) === 'tyrol') return 'tyrol'
  return UPPER_BAVARIA_WATERS.has(water.properties.id) ? 'upperBavaria' : 'swabia'
}

/** Data names that mean a species of the lists. Group names like "Forelle" or "Weißfische" have no rule. */
const ALIASES: Record<string, string> = {
  'Aitel (Döbel)': 'Döbel',
  Aitel: 'Döbel',
  Waller: 'Wels',
  Ukelei: 'Laube',
  Aalrutte: 'Rutte',
  Schied: 'Rapfen',
  Brachsen: 'Brachse',
  Barsch: 'Flussbarsch',
}

export interface SpeciesProtection {
  /** Name as in the data. */
  name: string
  rule: SpeciesRule
  /** Protected on the given day, by its closed season or all year. */
  protectedNow: boolean
}

/** The rules for the species of a water, in the order of the data. Species without a known rule are left out. */
export function speciesProtection(water: WaterFeature, day: Date): SpeciesProtection[] {
  const rules: Record<string, SpeciesRule> = PROTECTION[protectionAreaOf(water)].rules
  return water.properties.species.flatMap((name) => {
    const rule = rules[ALIASES[name.trim()] ?? name.trim()]
    if (!rule) return []
    return [{ name, rule, protectedNow: Boolean(rule.allYear || (rule.closed && isInRange(rule.closed, day))) }]
  })
}

/** Days from `day` to the next occurrence of `monthDay`, 0 when it is that day. */
function daysUntil(monthDay: MonthDay, day: Date): number {
  const [month, date] = monthDay.split('-').map(Number)
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  let target = new Date(day.getFullYear(), month! - 1, date!)
  if (target < start) target = new Date(day.getFullYear() + 1, month! - 1, date!)
  return Math.round((target.valueOf() - start.valueOf()) / 86_400_000)
}

export interface GroupProtection {
  /** Every species of the group at this water is protected on the day. */
  protected: boolean
  /** Last day of the closed season that ends first, null when every species is protected all year. */
  until: MonthDay | null
}

/**
 * Whether a species group of the filter (e.g. "Hecht" or "Forelle") is protected at a water on the day.
 * Only when every listed species of the group has a rule and is protected, because then nothing of the
 * group may be kept. A water that only lists a group name without rule ("Forelle") counts as not protected,
 * the app cannot tell. Null when the water does not list the group at all.
 */
export function groupProtection(water: WaterFeature, group: string, day: Date): GroupProtection | null {
  const names = water.properties.species.filter((name) => speciesGroup(name) === group)
  if (!names.length) return null
  const known = new Map(speciesProtection(water, day).map((s) => [s.name, s]))
  const entries = names.map((name) => known.get(name))
  if (entries.some((e) => !e || !e.protectedNow)) return { protected: false, until: null }
  // The group can be fished again as soon as the first seasonal protection ends. Species protected all year never open.
  const ends = entries.flatMap((e) => (e!.rule.closed && !e!.rule.allYear ? [e!.rule.closed.to] : []))
  if (!ends.length) return { protected: true, until: null }
  const until = ends.reduce((a, b) => (daysUntil(b, day) < daysUntil(a, day) ? b : a))
  return { protected: true, until }
}
