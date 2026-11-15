export function formatPrice(value: number): string {
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
}

export function formatDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  // new Date('2027-01-01') would be midnight UTC, which is still 31 December west of Greenwich.
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year!, month! - 1, day!).toLocaleDateString('de-DE')
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replaceAll(' ', '')}`
}

/** `14.5` -> `14,5 m`, `4` -> `4 m`. */
export function formatDepth(metres: number): string {
  return `${metres.toLocaleString('de-DE', { maximumFractionDigits: 1 })} m`
}
