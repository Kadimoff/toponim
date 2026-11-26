import Fuse from 'fuse.js'
import idx from '../data/archive/index.json'
import { fold, type Lang } from './data'
import { translit } from './translit'

export type ArcType = 'oikonym' | 'hydronym' | 'oronym' | 'site' | 'choronym'
export type ArcCategory = 'city' | 'river' | 'lake' | 'reservoir' | 'mountain' | 'range' | 'site' | 'historical-region'
export type ArcPeriod = 'ancient' | 'medieval' | 'early-modern' | 'modern' | 'contemporary'
export type Verification = 'sourced' | 'review'
export type SourceLang = 'az' | 'ru' | 'en'

export interface ArcIndexItem {
  id: string
  qid: string
  category: ArcCategory
  type: ArcType
  names: Record<Lang, string>
  coordinates: [number, number]
  region: string | null
  period: ArcPeriod | null
  firstYear: number | null
  forms: string[]
  langs: SourceLang[]
  hasEtymology: boolean
  hasImage: boolean
  thumb: string | null
  verification: Verification
}

export interface ArcSource {
  id: string
  kind: 'wikidata' | 'wikipedia' | 'commons'
  lang?: SourceLang
  title: string
  publisher: string
  url: string
  pageUrl?: string
  revid?: number
  revDate?: string
  licence: string
  retrieved: string
}
export interface ArcForm {
  form: string
  lang: string
  from?: number
  to?: number
  current?: boolean
  sources: string[]
}
export interface ArcFirstRecord {
  year: number
  precision: 'year' | 'decade' | 'century' | 'millennium'
  century?: number
  bce: boolean
  kind: 'earliest-record' | 'first-mention' | 'inception' | 'founded'
  source: string
}
export interface ArcEntry {
  id: string
  qid: string
  category: ArcCategory
  type: ArcType
  names: Record<Lang, string>
  coordinates: [number, number]
  coordinatesSource: string
  region: string | null
  regionSource: string | null
  admin: { qid: string; az: string; en: string }[]
  firstRecord: ArcFirstRecord | null
  period: ArcPeriod | null
  forms: ArcForm[]
  namedAfter: { qid: string; az?: string; en?: string; source: string }[]
  etymology: { lang: SourceLang; heading: string; text: string; truncated: boolean; source: string; anchor: string }[]
  summary: Partial<Record<SourceLang, { text: string; truncated: boolean; source: string }>>
  images: { thumb: string; small: string; width: number; height: number; page: string; title: string; artist: string | null; credit: string | null; license: string; licenseUrl: string | null; source: string }[]
  sources: ArcSource[]
  langs: SourceLang[]
  verification: Verification
}

export const ARC_META = idx.meta as { title: string; url: string; retrieved: string; count: number; licence: { az: string; en: string }; method: string; note: string }
export const ARCHIVE: ArcIndexItem[] = idx.items as ArcIndexItem[]
export const ARC_BY_ID = new Map(ARCHIVE.map((t) => [t.id, t]))

export const ARC_TYPES: ArcType[] = ['oikonym', 'hydronym', 'oronym', 'site', 'choronym']
export const ARC_PERIODS: ArcPeriod[] = ['ancient', 'medieval', 'early-modern', 'modern', 'contemporary']
export const VERIFICATIONS: Verification[] = ['sourced', 'review']
export const SOURCE_LANGS: SourceLang[] = ['az', 'ru', 'en']
/** 14 economic regions (2021). Order = north-west → south, Nakhchivan last. */
export const REGION_IDS = [
  'baki', 'abseron-xizi', 'quba-xacmaz', 'dagliq-sirvan', 'seki-zaqatala', 'qazax-tovuz', 'gence-daskesen',
  'merkezi-aran', 'qarabag', 'serqi-zengezur', 'mil-mugan', 'sirvan-salyan', 'lenkeran-astara', 'naxcivan',
] as const
export type RegionId = (typeof REGION_IDS)[number]

// ---------- lazy entry loading (one small chunk per entry) ----------
const loaders = import.meta.glob<{ default: ArcEntry }>('../data/archive/entries/*.json')
const cache = new Map<string, ArcEntry>()
export async function loadEntry(id: string): Promise<ArcEntry | null> {
  if (cache.has(id)) return cache.get(id)!
  const fn = loaders[`../data/archive/entries/${id}.json`]
  if (!fn) return null
  const e = (await fn()).default
  cache.set(id, e)
  return e
}

// ---------- search ----------
function keysFor(t: ArcIndexItem): string[] {
  const out = new Set<string>()
  for (const s of [t.names.az, t.names.ru, t.names.en, ...t.forms]) {
    out.add(fold(s))
    out.add(fold(translit(s)))
  }
  return [...out].filter(Boolean)
}
const fuse = new Fuse(
  ARCHIVE.map((t) => ({ t, keys: keysFor(t) })),
  { keys: ['keys'], threshold: 0.34, ignoreLocation: true, includeScore: true, minMatchCharLength: 2 },
)
export function searchArchive(q: string): ArcIndexItem[] {
  const query = fold(translit(q.trim()))
  if (!query) return ARCHIVE
  return fuse.search(query).map((r) => r.item.t)
}

export interface ArcFilters {
  types: Set<ArcType>
  periods: Set<ArcPeriod | 'unknown'>
  regions: Set<string>
  langs: Set<SourceLang>
  verifications: Set<Verification>
}
export const emptyArcFilters = (): ArcFilters => ({ types: new Set(), periods: new Set(), regions: new Set(), langs: new Set(), verifications: new Set() })
export const arcFilterCount = (f: ArcFilters) => f.types.size + f.periods.size + f.regions.size + f.langs.size + f.verifications.size

export function applyArcFilters(items: ArcIndexItem[], f: ArcFilters): ArcIndexItem[] {
  return items.filter(
    (t) =>
      (!f.types.size || f.types.has(t.type)) &&
      (!f.periods.size || f.periods.has(t.period ?? 'unknown')) &&
      (!f.regions.size || f.regions.has(t.region ?? 'none')) &&
      (!f.langs.size || [...f.langs].every((l) => t.langs.includes(l))) &&
      (!f.verifications.size || f.verifications.has(t.verification)),
  )
}

/** filters <-> hash query (?q=&type=a,b&region=…) so a filtered view can be shared */
export function filtersToQuery(q: string, f: ArcFilters): string {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  const put = (k: string, s: Set<string>) => s.size && p.set(k, [...s].join(','))
  put('type', f.types)
  put('period', f.periods)
  put('region', f.regions)
  put('lang', f.langs)
  put('status', f.verifications)
  const s = p.toString()
  return s ? `?${s}` : ''
}
export function filtersFromQuery(query: string): { q: string; f: ArcFilters } {
  const p = new URLSearchParams(query)
  const get = <T extends string>(k: string, allowed: readonly string[]) => new Set((p.get(k)?.split(',') ?? []).filter((v) => allowed.includes(v)) as T[])
  return {
    q: p.get('q') ?? '',
    f: {
      types: get('type', ARC_TYPES),
      periods: get('period', [...ARC_PERIODS, 'unknown']),
      regions: get('region', [...REGION_IDS, 'none']),
      langs: get('lang', SOURCE_LANGS),
      verifications: get('status', VERIFICATIONS),
    },
  }
}

// ---------- formatting ----------
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
export function formatWhen(r: Pick<ArcFirstRecord, 'year' | 'precision' | 'century' | 'bce'>, lang: Lang): string {
  const bce = { az: 'e.ə. ', ru: '', en: '' }[lang]
  const bceAfter = { az: '', ru: ' до н. э.', en: ' BC' }[lang]
  if (r.precision === 'century' && r.century) {
    const c = ROMAN[r.century] ?? String(r.century)
    const word = { az: ' əsr', ru: ' век', en: ' century' }[lang]
    return r.bce ? `${bce}${c}${word}${bceAfter}` : `${c}${word}`
  }
  const y = Math.abs(r.year)
  const base = r.precision === 'decade' ? `${y}s` : String(y)
  return r.bce ? `${bce}${base}${bceAfter}` : base
}

export function formRange(f: ArcForm): string {
  if (f.from && f.to) return `${f.from}–${f.to}`
  if (f.to) return `–${f.to}`
  if (f.from) return `${f.from}–`
  return ''
}

export function permalink(id: string): string {
  return `${location.origin}${location.pathname}#/arxiv/${encodeURIComponent(id)}`
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** APA 7 style reference for an archive entry (an online database record). */
export function citeAPA(e: Pick<ArcEntry, 'id' | 'names'>, lang: Lang, today = new Date()): string {
  const year = (ARC_META.retrieved || '').slice(0, 4) || String(today.getFullYear())
  const url = permalink(e.id)
  const d = String(today.getDate()).padStart(2, '0')
  const mth = String(today.getMonth() + 1).padStart(2, '0')
  if (lang === 'en')
    return `Smart Toponym Atlas. (${year}). ${e.names.en} [Open toponym archive record]. Retrieved ${MONTHS_EN[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}, from ${url}`
  if (lang === 'ru')
    return `Ağıllı Toponim Atlası. (${year}). ${e.names.ru} [Запись открытого архива топонимов]. Дата обращения: ${d}.${mth}.${today.getFullYear()}. ${url}`
  return `Ağıllı Toponim Atlası. (${year}). ${e.names.az} [Açıq toponim arxivi qeydi]. ${d}.${mth}.${today.getFullYear()} tarixində ${url} ünvanından əldə edilib.`
}

/** APA style reference for one Wikipedia revision. */
export function citeSource(s: ArcSource): string {
  let url = s.url
  try {
    url = decodeURI(s.url)
  } catch {
    /* keep encoded */
  }
  if (s.kind === 'wikipedia') return `${s.title}. (${s.revDate || s.retrieved}). In ${s.publisher}. ${url}`
  if (s.kind === 'wikidata') return `${s.title}. (${s.retrieved}). Wikidata. ${url}`
  return `${s.title}. Wikimedia Commons. ${s.licence}. ${url}`
}

/** prefilled e-mail for corrections and new sources (no backend, nothing stored) */
export const SUGGEST_EMAIL = ''
export function suggestMailto(subject: string, body: string): string {
  return `mailto:${SUGGEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
