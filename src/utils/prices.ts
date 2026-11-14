import { PRICE_LABELS } from '@/config'
import type { Prices, WaterProperties } from '@/types'
import { formatDate, formatPrice } from '@/utils/format'

export interface PricesOnDate {
  /** The list to show as the current one, null if no prices are known. */
  current: Prices | null
  /** A newer list that is announced but not valid yet, shown as a hint. */
  upcoming: Prices | null
}

/** Local calendar day as `YYYY-MM-DD`, comparable with `validFrom`. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Which price list applies on a day.
 *
 * `prices` is the newest list. While its `validFrom` lies ahead, `previousPrices` stay the
 * current ones and the new list is only announced. Without `previousPrices` the new list is
 * shown right away, together with its date.
 */
export function pricesOn(p: Pick<WaterProperties, 'prices' | 'previousPrices'>, now: Date): PricesOnDate {
  const newest = p.prices
  if (!newest) return { current: null, upcoming: null }
  const notYetValid = Boolean(newest.validFrom && newest.validFrom > isoDay(now))
  if (notYetValid && p.previousPrices) return { current: p.previousPrices, upcoming: newest }
  return { current: newest, upcoming: null }
}

/** Guest price on that day, null if there is none. */
export function guestPriceOn(p: Pick<WaterProperties, 'prices' | 'previousPrices'>, now: Date): number | null {
  const guest = pricesOn(p, now).current?.guest
  return typeof guest === 'number' ? guest : null
}

/** "Ab 1.1.2027: Gast 25 €, Mitglied 20 €" for an announced price list. */
export function describeUpcoming(prices: Prices): string {
  const parts = (Object.keys(PRICE_LABELS) as (keyof typeof PRICE_LABELS)[]).flatMap((key) => {
    const value = prices[key]
    return typeof value === 'number' ? [`${PRICE_LABELS[key]} ${formatPrice(value)}`] : []
  })
  const date = formatDate(prices.validFrom)
  return `${date ? `Ab ${date}` : 'Demnächst'}: ${parts.length ? parts.join(', ') : 'neue Preise'}.`
}
