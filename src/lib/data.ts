import raw from '../data/toponyms.json'

export type Lang = 'az' | 'ru' | 'en'
export type ToponymType = 'oikonym' | 'hydronym' | 'oronym'
export type Period = 'c16' | 'c17' | 'c18' | 'c19'
export type Status = 'verified' | 'pending'
export type SourceKind = 'tax' | 'cameral' | 'map' | 'waqf' | 'census' | 'chronicle' | 'military'

export interface HistoricalForm {
  form: string
  year: number
  source: string
  kind: SourceKind
}
export interface Toponym {
  id: string
  names: Record<Lang, string>
  type: ToponymType
  region: string
  coordinates: [number, number]
  historicalForms: HistoricalForm[]
  meaning: Record<Lang, string>
  sources: { code: string; kind: SourceKind; year: number }[]
  status: Status
  confidence: number
  verifiedBy?: string
  /** derived: century of earliest attestation */
  period: Period
  firstYear: number
}

function periodOf(year: number): Period {
  if (year < 1700) return year < 1600 ? 'c16' : 'c17'
  return year < 1800 ? 'c18' : 'c19'
}

export const TOPONYMS: Toponym[] = (raw.items as Omit<Toponym, 'period' | 'firstYear'>[]).map((t) => {
  const firstYear = Math.min(...t.historicalForms.map((f) => f.year))
  return { ...t, firstYear, period: periodOf(firstYear) }
})

export const BY_ID = new Map(TOPONYMS.map((t) => [t.id, t]))
export const TYPES: ToponymType[] = ['oikonym', 'hydronym', 'oronym']
export const PERIODS: Period[] = ['c16', 'c17', 'c18', 'c19']
export const STATUSES: Status[] = ['verified', 'pending']

/** Fold Azerbaijani / Cyrillic-transliterated spellings into one ASCII-ish key so "Gumushdara", "Gümüşdərə", "Gyumyushdere" meet. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 'sh')
    .replace(/ç/g, 'ch')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/q/g, 'g')
    .replace(/x/g, 'kh')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/gh/g, 'g')
    .replace(/yu/g, 'u')
    .replace(/[^a-zа-яё]/g, '')
}
