import type { WaterFeature } from '@/types'

// What a guest needs besides the day ticket, per country. Shown in the water detail.
// Checked against the official pages listed in `sources`. Update `checked` when you check again.

export type LegalRegion = 'bavaria' | 'tyrol'

export interface LegalInfo {
  /** Summary of the collapsible section. */
  title: string
  points: string[]
  sources: { label: string; url: string }[]
  /** ISO date of the last check against the sources. */
  checked: string
}

export const LEGAL: Record<LegalRegion, LegalInfo> = {
  bavaria: {
    title: 'Was Du in Bayern zum Angeln brauchst',
    points: [
      'Einen gültigen Fischereischein. Scheine aus anderen Bundesländern gelten auch in Bayern, Scheine aus dem Ausland nicht.',
      'Dazu die Tageskarte für genau dieses Gewässer.',
      'Kinder und Jugendliche ab 7 Jahren dürfen ohne eigenen Schein angeln, wenn eine Begleitperson dabei ist. Einen eigenen Fischereischein gibt es ab 14.',
      'Urlauber ohne Wohnsitz in Deutschland bekommen ohne Prüfung einen Jahresfischereischein, wenn sie zeigen, dass sie zu Hause fischen dürfen. Zuständig ist die Behörde am Urlaubsort.',
    ],
    sources: [{ label: 'Stadt München: Fischereischein', url: 'https://stadt.muenchen.de/service/info/fischereischein-beantragen/1073758/' }],
    checked: '2026-11-19',
  },
  tyrol: {
    title: 'Was Du in Tirol zum Angeln brauchst',
    points: [
      'Eine Tiroler Fischerkarte oder, als Urlauber, die Tiroler Gastfischerkarte. Sie gilt 14 Tage in ganz Tirol und kostet bei den Ausgabestellen 25 €.',
      'Für die Gastfischerkarte reicht Dein deutscher Fischereischein als Nachweis.',
      'Dazu die Tageslizenz für das Revier. Gastfischerkarte und Tageslizenz gibt es meist an derselben Ausgabestelle.',
      'Einen amtlichen Lichtbildausweis mitnehmen, er gehört zur Gastfischerkarte.',
      'Selbst fischen darf man ab 14 Jahren. Jüngere dürfen bei einer Aufsichtsperson mitfischen, wenn der Bewirtschafter zustimmt.',
    ],
    sources: [
      { label: 'oesterreich.gv.at: Fischen in Tirol', url: 'https://www.oesterreich.gv.at/themen/reisen_und_freizeit/freizeit-in-der-natur/fischen/7/Seite.3170057.html' },
      { label: 'Tiroler Fischereiverband', url: 'https://www.tiroler-fischereiverband.at/rechtliches/voraussetzungen-fuer-das-fischen.html' },
    ],
    checked: '2026-11-19',
  },
}

/** Waters in Tyrol have ids starting with `at-` (a data test makes sure they lie in Tyrol), all others are in Bavaria. */
export function legalRegionOf(water: WaterFeature): LegalRegion {
  return water.properties.id.startsWith('at-') ? 'tyrol' : 'bavaria'
}

/** Shown instead of the state licence points for waters marked `licenceExempt`, e.g. a Tyrolean Angelteich. */
export const LICENCE_EXEMPT_NOTE =
  'An diesem Gewässer brauchst Du keinen staatlichen Schein, weder Fischerkarte noch Gastfischerkarte. Es reicht die Karte des Betreibers.'
