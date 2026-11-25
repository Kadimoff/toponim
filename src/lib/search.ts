import Fuse from 'fuse.js'
import { TOPONYMS, fold, type Toponym } from './data'

const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
}
export const translit = (s: string) =>
  s
    .toLowerCase()
    .split('')
    .map((c) => RU[c] ?? c)
    .join('')

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
