export function formatPrice(value: number): string {
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
}

export function formatDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  return new Date(isoDate).toLocaleDateString('de-DE')
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replaceAll(' ', '')}`
}

/** `14.5` -> `14,5 m`, `4` -> `4 m`. */
export function formatDepth(metres: number): string {
  return `${metres.toLocaleString('de-DE', { maximumFractionDigits: 1 })} m`
}
