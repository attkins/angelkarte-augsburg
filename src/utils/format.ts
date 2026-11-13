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
