import { TOPONYMS, fold, type Toponym } from './data'
import { translit } from './search'

/**
 * DEMO SIMULATION of the extraction model: a dictionary matcher over every
 * known spelling (AZ / RU / EN / historical), tolerant of Azerbaijani case
 * suffixes (-da, -dan, -ın, -un …) and pre-reform Cyrillic. Not a real model.
 */
export interface Hit {
  start: number
  end: number
  text: string
  toponym: Toponym
  matched: string
  viaHistorical: boolean
  confidence: number
}

const ABBR = /^(р|г|оз|хр|пер|ист)\.\s*/i
const key = (s: string) => fold(translit(s.replace(ABBR, '')))

interface Entry {
  k: string
  t: Toponym
  form: string
  historical: boolean
}

const ENTRIES: Entry[] = TOPONYMS.flatMap((t) => {
  const current = [t.names.az, t.names.ru, t.names.en].map((f) => ({ k: key(f), t, form: f, historical: false }))
  const hist = t.historicalForms
    .filter((f) => !/\s/.test(f.form.replace(ABBR, '')))
    .map((f) => ({ k: key(f.form), t, form: f.form, historical: true }))
  return [...current, ...hist]
})
  .filter((e) => e.k.length >= 5)
  .sort((a, b) => b.k.length - a.k.length)

const TOKEN = /[\p{L}][\p{L}\-ʼ’']*/gu

export function extract(text: string): Hit[] {
  const hits: Hit[] = []
  for (const m of text.matchAll(TOKEN)) {
    const raw = m[0]
    const k = key(raw)
    if (k.length < 5) continue
    const e = ENTRIES.find((en) => k.startsWith(en.k) && k.length - en.k.length <= 4)
    if (!e) continue
    const suffixPenalty = (k.length - e.k.length) * 0.01
    const confidence = Math.max(0.55, Math.min(0.99, e.t.confidence * (e.historical ? 0.94 : 1) - suffixPenalty))
    hits.push({
      start: m.index!,
      end: m.index! + raw.length,
      text: raw,
      toponym: e.t,
      matched: e.form,
      viaHistorical: e.historical,
      confidence: Math.round(confidence * 100) / 100,
    })
  }
  return hits
}
