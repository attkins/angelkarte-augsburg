/** What the report mail needs to know about a water. */
export interface ReportTarget {
  id: string
  name: string
}

/**
 * `mailto:` link for reporting a wrong entry. The subject and body carry the water
 * name, its ID and a link, so the report can be matched to the data without asking back.
 */
export function reportMailto(email: string, water: ReportTarget, pageUrl: string): string {
  const subject = `Angelkarte: Fehler bei ${water.name}`
  const body = [
    `Gewässer: ${water.name}`,
    `ID: ${water.id}`,
    `Link: ${pageUrl}`,
    '',
    'Was stimmt nicht, und woher weißt Du es (Link, Aushang, Verein)?',
    '',
  ].join('\n')
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
