import Fuse from 'fuse.js'
import { TOPONYMS, fold, type Toponym } from './data'

import { translit } from './translit'
export { translit }

/** Every spelling a person might type, folded to one alphabet. */
function keysFor(t: Toponym): string[] {
  const all = [t.names.az, t.names.en, t.names.ru, ...t.historicalForms.map((f) => f.form)]
  const out = new Set<string>()
  for (const s of all) {
    out.add(fold(s))
    out.add(fold(translit(s)))
  }
  return [...out].filter(Boolean)
}

interface Row {
  t: Toponym
  keys: string[]
}

const fuse = new Fuse<Row>(
  TOPONYMS.map((t) => ({ t, keys: keysFor(t) })),
  { keys: ['keys'], threshold: 0.38, ignoreLocation: true, includeScore: true, minMatchCharLength: 2 },
)

export function search(q: string): Toponym[] {
  const query = fold(translit(q.trim()))
  if (!query) return TOPONYMS
  return fuse.search(query).map((r) => r.item.t)
}
