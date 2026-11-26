// Deterministic choice of archive items from the cached Wikidata candidates.
import { BOUNDS, SELECTION } from './config.mjs'

const titleOf = (url) => (url ? decodeURIComponent(url.replace(/^https:\/\/\w+\.wikipedia\.org\/wiki\//, '')).replace(/_/g, ' ') : undefined)
const fileOf = (url) => (url ? decodeURIComponent(url.replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, '')).replace(/_/g, ' ') : undefined)

export function parsePoint(wkt) {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(wkt || '')
  return m ? [Number(Number(m[1]).toFixed(5)), Number(Number(m[2]).toFixed(5))] : null
}

export function pick(cand) {
  const seen = new Set()
  const out = []
  for (const sel of SELECTION) {
    const byQ = new Map()
    for (const r of cand[sel.category] || []) {
      // rows repeat per optional value (several images/admins); keep the first, collect admins
      const cur = byQ.get(r.i)
      if (cur) {
        if (r.adm && !cur.adm.some((a) => a.qid === r.adm)) cur.adm.push({ qid: r.adm, az: r.admAz, en: r.admEn })
        continue
      }
      const coord = parsePoint(r.coord)
      byQ.set(r.i, {
        qid: r.i,
        category: sel.category,
        type: sel.type,
        sitelinks: Number(r.sl),
        labels: { az: r.az, ru: r.ru, en: r.en },
        coord,
        image: fileOf(r.img),
        wiki: { az: titleOf(r.azw), ru: titleOf(r.ruw), en: titleOf(r.enw) },
        adm: r.adm ? [{ qid: r.adm, az: r.admAz, en: r.admEn }] : [],
      })
    }
    const rows = [...byQ.values()]
      .filter((x) => !seen.has(x.qid) && x.labels.az && x.coord)
      .filter(({ coord: [x, y] }) => x >= BOUNDS.w && x <= BOUNDS.e && y >= BOUNDS.s && y <= BOUNDS.n)
      .filter((x) => x.wiki.az || x.wiki.en || x.wiki.ru)
      .sort((a, b) => b.sitelinks - a.sitelinks || a.qid.localeCompare(b.qid))
      .slice(0, sel.top)
    rows.forEach((x) => seen.add(x.qid))
    out.push(...rows)
  }
  return out
}
