#!/usr/bin/env node
// Offline: data/archive-cache/* → src/data/archive/index.json + src/data/archive/entries/<id>.json
//                                  + public/data/toponim-arxiv.json / .csv (open dataset download)
// Every claim keeps a pointer to the source it came from; anything we cannot source stays empty.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REGIONS } from './config.mjs'
import { pick } from './select.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, 'data', 'archive-cache')
const OUT = join(ROOT, 'src', 'data', 'archive')
const PUB = join(ROOT, 'public', 'data')
const read = (f, d = {}) => (existsSync(join(CACHE, f)) ? JSON.parse(readFileSync(join(CACHE, f), 'utf8')) : d)

const cand = read('wikidata-candidates.json', null)
if (!cand) {
  console.error('No cache. Run: npm run data:fetch')
  process.exit(1)
}
const stmts = read('wikidata-statements.json')
const WP = { az: read('wikipedia-az.json'), ru: read('wikipedia-ru.json'), en: read('wikipedia-en.json') }
const commons = read('commons.json')
const meta = read('meta.json', { fetchedAt: '' })
const RETRIEVED = meta.fetchedAt

// ---------- helpers ----------
const stripParen = (s) => (s || '').replace(/\s*\([^)]*\)\s*$/, '').trim()
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const foldKey = (s) =>
  s
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')

function cleanText(s) {
  return s
    .replace(/\(\s*[;,]?\s*\)/g, '')
    .replace(/\(\s*;\s*/g, '(')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.;:])/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
/** cut at a sentence end before `max` chars */
function clip(s, max) {
  s = cleanText(s)
  if (s.length <= max) return { text: s, truncated: false }
  const cut = s.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('» '))
  return { text: (end > max * 0.45 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + ' …').trim(), truncated: true }
}

function wikiPlain(s) {
  return s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/&nbsp;/g, ' ')
}

// years like 1804, 1804-cü, "e.ə. 500"
function parseRange(s) {
  const m = s.match(/\(([^)]*)\)/)
  if (!m) return {}
  const inner = m[1]
  const ys = [...inner.matchAll(/(\d{3,4})/g)].map((x) => Number(x[1]))
  const dash = /[–—-]/.test(inner)
  if (!ys.length) return {}
  if (ys.length >= 2) return { from: ys[0], to: ys[1] }
  if (/^\s*[–—-]/.test(inner) || /^\s*(до|qədər)/i.test(inner) || /qədər|до/i.test(inner)) return { to: ys[0] }
  if (dash || /dən|dan|с\s/i.test(inner)) return { from: ys[0] }
  return { from: ys[0] }
}

function formsFromAzInfobox(raw) {
  if (!raw) return []
  const txt = wikiPlain(raw).replace(/\{\{h\.\s*h\.\}\}/gi, 'h.h.').replace(/\{\{[^}]*\}\}/g, '')
  return txt
    .split(/<br\s*\/?>|;|\n/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const name = p.replace(/\(.*$/, '').replace(/[,.]$/, '').trim()
      const r = parseRange(p)
      if (/h\.h\./.test(p) && r.from && !r.to) r.current = true
      return { form: name, ...r }
    })
    .filter((f) => f.form && f.form.length <= 40 && /\p{L}/u.test(f.form))
}

function formsFromRuInfobox(raw) {
  if (!raw) return []
  const out = []
  // {{НП-ПН|1938|Зубовка|2008|Али-Байрамлы}} = "Зубовка until 1938, Али-Байрамлы until 2008"
  let flat = wikiPlain(raw)
  // drop templates nested inside НП-ПН (footnote markers like {{efn|…}}), innermost first
  for (let k = 0; k < 5; k++) flat = flat.replace(/\{\{(?!НП-ПН)[^{}]*\}\}/g, '')
  for (const m of flat.matchAll(/\{\{НП-ПН\|([^}]*)\}\}/g)) {
    const parts = m[1].split('|').map((x) => x.trim())
    // a template with an unknown year ("?") is not read consistently in articles: keep its names, drop its dates
    const datesOk = parts.every((x, i) => i % 2 === 1 || /^\d{3,4}$/.test(x))
    for (let i = 0; i + 1 < parts.length; i += 2) {
      const y = datesOk ? parts[i].match(/(\d{3,4})/) : null
      const form = parts[i + 1].replace(/\u0301/g, '').replace(/\{\{[^}]*\}\}/g, '').trim()
      if (form) out.push({ form, ...(y ? { to: Number(y[1]) } : {}) })
    }
  }
  if (out.length) return out.filter((f) => f.form.length <= 40 && /\p{L}/u.test(f.form))
  return wikiPlain(raw)
    .replace(/\{\{[^}]*\}\}/g, '')
    .split(/<br\s*\/?>|;|\n|,(?![^(]*\))/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ form: p.replace(/\(.*$/, '').replace(/\u0301/g, '').trim(), ...parseRange(p) }))
    .filter((f) => f.form && f.form.length <= 40 && /\p{L}/u.test(f.form))
}

const ROMAN = { I: 1, V: 5, X: 10 }
const roman = (s) => [...s].reduce((a, c, i, arr) => (ROMAN[c] < (ROMAN[arr[i + 1]] || 0) ? a - ROMAN[c] : a + ROMAN[c]), 0)
/** free text like "859", "V век до н. э.", "XII əsr" → {year, precision, bce} */
function parseWhen(raw) {
  if (!raw) return null
  const t = wikiPlain(raw).replace(/\{\{[^}]*\}\}/g, ' ').replace(/<[^>]+>/g, ' ')
  const bce = /до\s*н\.?\s*э|e\.?\s*ə\.?|eramızdan əvvəl|BC/i.test(t)
  const c = t.match(/\b([IVX]{1,5})\s*(век|в\.|əsr|century)/i)
  if (c) {
    const n = roman(c[1].toUpperCase())
    return { year: bce ? -(n * 100) : (n - 1) * 100 + 1, precision: 'century', century: n, bce }
  }
  const y = t.match(/\b(\d{3,4})\b/)
  if (y) return { year: bce ? -Number(y[1]) : Number(y[1]), precision: 'year', bce }
  return null
}
function fromWikidataTime(time, precision) {
  const m = /^([+-]?)(\d+)-/.exec(time || '')
  if (!m) return null
  const y = Number(m[2]) * (m[1] === '-' ? -1 : 1)
  if (precision >= 9) return { year: y, precision: 'year', bce: y < 0 }
  if (precision === 8) return { year: y, precision: 'decade', bce: y < 0 }
  if (precision === 7) {
    const n = Math.ceil(Math.abs(y) / 100) || 1
    return { year: y < 0 ? -(n * 100) : (n - 1) * 100 + 1, precision: 'century', century: n, bce: y < 0 }
  }
  return { year: y, precision: 'millennium', bce: y < 0 }
}
function periodOf(year) {
  if (year == null) return null
  if (year < 500) return 'ancient'
  if (year < 1500) return 'medieval'
  if (year < 1800) return 'early-modern'
  if (year < 1920) return 'modern'
  return 'contemporary'
}
// economic region membership from the AZ Wikipedia table: link target → region id
const regionTable = read('regions-az.json', null)
const MEMBER = new Map()
if (regionTable) {
  for (const row of regionTable.table.split(/\n\|-/)) {
    const rm = row.match(/\[\[([^|\]]+?) iqtisadi rayonu(?:\|[^\]]*)?\]\]/)
    if (!rm) continue
    const reg = REGIONS.find((r) => r.match[0].test(rm[1]))
    if (!reg) continue
    for (const lm of row.matchAll(/\[\[([^|\]]+)(?:\|[^\]]*)?\]\]/g)) if (!/iqtisadi rayonu/.test(lm[1])) MEMBER.set(lm[1].trim(), reg.id)
  }
}
const regionByLink = (name) => (name ? MEMBER.get(name) ?? MEMBER.get(name.replace(/ \(şəhər\)$/, '')) ?? null : null)

const regionOf = (raw, lang) => {
  if (!raw) return null
  const txt = wikiPlain(raw)
  const r = REGIONS.find((x) => x.match[lang === 'az' ? 0 : 1].test(txt.trim()))
  return r ? r.id : null
}
const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const OPEN_LICENCE = /^(cc0|cc[ -]by(-sa)?([ -][\d.]+)?|public domain|pd\b|attribution|gfdl)/i

// ---------- build ----------
const items = pick(cand)
const used = new Set()
const index = []
const entries = []

for (const it of items) {
  const st = stmts[it.qid] || { officialNames: [], times: [], namedAfter: [] }
  const nameAz = stripParen(it.labels.az)
  let id = slug(nameAz)
  if (used.has(id)) id = `${id}-${it.category}`
  used.add(id)

  const sources = []
  const addSrc = (s) => {
    if (!sources.some((x) => x.id === s.id)) sources.push(s)
    return s.id
  }
  const wd = addSrc({ id: 'wd', kind: 'wikidata', title: `Wikidata ${it.qid}: ${it.labels.en || nameAz}`, publisher: 'Wikidata', url: `https://www.wikidata.org/wiki/${it.qid}`, licence: 'CC0 1.0', retrieved: RETRIEVED })
  const wp = {}
  for (const lang of ['az', 'ru', 'en']) {
    const title = it.wiki[lang]
    const rec = title && WP[lang][title]
    if (!rec || rec.missing) continue
    wp[lang] = rec
    addSrc({
      id: `wp-${lang}`,
      kind: 'wikipedia',
      lang,
      title: rec.title,
      publisher: { az: 'Vikipediya (azərbaycanca)', ru: 'Википедия (на русском)', en: 'Wikipedia (English)' }[lang],
      url: `https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(rec.title.replace(/ /g, '_'))}&oldid=${rec.revid}`,
      pageUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(rec.title.replace(/ /g, '_'))}`,
      revid: rec.revid,
      revDate: (rec.revTimestamp || '').slice(0, 10),
      licence: 'CC BY-SA 4.0',
      retrieved: RETRIEVED,
    })
  }

  // --- historical forms
  const forms = []
  const addForm = (f, src, lang) => {
    const key = foldKey(f.form) + (f.to ?? '') + (f.from ?? '')
    const same = forms.find((x) => x.key === key || (foldKey(x.form) === foldKey(f.form) && (x.from === f.from || x.to === f.to)))
    if (same) {
      if (!same.sources.includes(src)) same.sources.push(src)
      same.from ??= f.from
      same.to ??= f.to
      if (f.current) same.current = true
      return
    }
    forms.push({ key, form: f.form, lang, ...(f.from ? { from: f.from } : {}), ...(f.to ? { to: f.to } : {}), ...(f.current ? { current: true } : {}), sources: [src] })
  }
  for (const o of st.officialNames) {
    const from = o.start ? parseInt(o.start, 10) : undefined
    const to = o.end ? parseInt(o.end, 10) : undefined
    if (!from && !to) continue // a bare current official name adds nothing to the history
    if (!['az', 'ru', 'en'].includes(o.lang)) continue
    addForm({ form: o.name, from, to, ...(from && !to ? { current: true } : {}) }, wd, o.lang)
  }
  if (wp.az) for (const f of formsFromAzInfobox(wp.az.infobox?.formerNames)) addForm(f, 'wp-az', 'az')
  if (wp.ru) for (const f of formsFromRuInfobox(wp.ru.infobox?.formerNames)) addForm(f, 'wp-ru', 'ru')
  forms.sort((a, b) => (a.current ? 1 : 0) - (b.current ? 1 : 0) || (a.to ?? 1e9) - (b.to ?? 1e9) || (a.from ?? -1e9) - (b.from ?? -1e9))
  forms.forEach((f) => delete f.key)

  // --- etymology / name sections (quoted, with source)
  const etymology = []
  for (const lang of ['az', 'ru', 'en']) {
    for (const s of wp[lang]?.sections || []) {
      const c = clip(s.text, 1100)
      if (c.text.length < 60) continue
      etymology.push({ lang, heading: s.heading, text: c.text, truncated: c.truncated, source: `wp-${lang}`, anchor: s.heading.replace(/ /g, '_') })
      break // one section per language is enough
    }
  }
  const namedAfter = st.namedAfter.filter((n) => n.az || n.en).map((n) => ({ qid: n.qid, az: n.az, en: n.en, source: wd }))

  // --- summaries
  const summary = {}
  for (const lang of ['az', 'ru', 'en']) {
    const intro = wp[lang]?.intro
    if (intro && intro.length > 40) {
      const c = clip(intro, 520)
      summary[lang] = { text: c.text, truncated: c.truncated, source: `wp-${lang}` }
    }
  }

  // --- first record / foundation
  let first = null
  const p1249 = st.times.find((t) => t.prop === 'P1249')
  const p571 = st.times.find((t) => t.prop === 'P571')
  if (p1249) first = { ...fromWikidataTime(p1249.time, p1249.precision), kind: 'earliest-record', source: wd }
  else if (wp.ru?.infobox?.firstMention && parseWhen(wp.ru.infobox.firstMention)) first = { ...parseWhen(wp.ru.infobox.firstMention), kind: 'first-mention', source: 'wp-ru' }
  else if (p571) first = { ...fromWikidataTime(p571.time, p571.precision), kind: 'inception', source: wd }
  else if (wp.ru?.infobox?.founded && parseWhen(wp.ru.infobox.founded)) first = { ...parseWhen(wp.ru.infobox.founded), kind: 'founded', source: 'wp-ru' }
  else if (wp.az?.infobox?.founded && parseWhen(wp.az.infobox.founded)) first = { ...parseWhen(wp.az.infobox.founded), kind: 'founded', source: 'wp-az' }
  if (first && first.year == null) first = null

  // --- region (economic region, from the article infobox)
  let region = null
  let regionSource = null
  const viaTable = regionByLink(it.wiki.az) ?? it.adm.map((x) => regionByLink(x.az)).find(Boolean) ?? regionByLink(wikiPlain(wp.az?.infobox?.region ?? '').trim())
  if (viaTable && regionTable) {
    region = viaTable
    regionSource = addSrc({
      id: 'wp-az-regions',
      kind: 'wikipedia',
      lang: 'az',
      title: regionTable.title,
      publisher: 'Vikipediya (azərbaycanca)',
      url: `https://az.wikipedia.org/w/index.php?title=${encodeURIComponent(regionTable.title.replace(/ /g, '_'))}&oldid=${regionTable.revid}`,
      pageUrl: `https://az.wikipedia.org/wiki/${encodeURIComponent(regionTable.title.replace(/ /g, '_'))}`,
      revid: regionTable.revid,
      revDate: (regionTable.revTimestamp || '').slice(0, 10),
      licence: 'CC BY-SA 4.0',
      retrieved: RETRIEVED,
    })
  } else if (wp.az?.infobox?.region && regionOf(wp.az.infobox.region, 'az')) [region, regionSource] = [regionOf(wp.az.infobox.region, 'az'), 'wp-az']
  else if (wp.ru?.infobox?.region && regionOf(wp.ru.infobox.region, 'ru')) [region, regionSource] = [regionOf(wp.ru.infobox.region, 'ru'), 'wp-ru']

  // --- images (openly licensed only, with attribution)
  const images = []
  const img = it.image && commons[it.image]
  if (img && !img.missing && img.thumb && OPEN_LICENCE.test(img.license || '')) {
    const sid = addSrc({ id: 'img-1', kind: 'commons', title: img.title, publisher: 'Wikimedia Commons', url: img.page, licence: img.license, retrieved: RETRIEVED })
    // Commons serves standard thumbnail steps; 800px was requested, so step down to 500 (page) and 250 (cards)
    const scaled = /\/800px-/.test(img.thumb)
    const step = (w) => (scaled ? img.thumb.replace('/800px-', `/${w}px-`) : img.thumb)
    images.push({ thumb: step(500), small: step(250), width: scaled ? 500 : img.thumbWidth, height: scaled ? Math.round((img.thumbHeight * 500) / img.thumbWidth) : img.thumbHeight, page: img.page, title: img.title.replace(/^File:/, ''), artist: stripHtml(img.artist) || null, credit: stripHtml(img.credit) || null, license: img.license, licenseUrl: img.licenseUrl || null, source: sid })
  }

  const sourced = etymology.length > 0 || forms.length > 0 || namedAfter.length > 0
  const entry = {
    id,
    qid: it.qid,
    category: it.category,
    type: it.type,
    names: { az: nameAz, ru: stripParen(it.labels.ru) || nameAz, en: stripParen(it.labels.en) || nameAz },
    coordinates: it.coord,
    coordinatesSource: wd,
    region,
    regionSource,
    // P131 also lists historical units (khanates, uyezds) and, for rivers, foreign provinces: keep current Azerbaijani districts only
    admin: it.adm
      .filter((a) => a.qid !== 'Q227' && /(rayonu|Muxtar Respublikası|^Bakı$)$/.test(a.az || ''))
      .map((a) => ({ qid: a.qid, az: a.az, en: a.en || a.az })),
    firstRecord: first,
    period: periodOf(first?.year),
    forms,
    namedAfter,
    etymology,
    summary,
    images,
    sources,
    langs: Object.keys(wp),
    verification: sourced ? 'sourced' : 'review',
  }
  entries.push(entry)
  index.push({
    id,
    qid: it.qid,
    category: it.category,
    type: it.type,
    names: entry.names,
    coordinates: entry.coordinates,
    region,
    period: entry.period,
    firstYear: first?.year ?? null,
    forms: forms.map((f) => f.form),
    langs: entry.langs,
    hasEtymology: etymology.length > 0,
    hasImage: images.length > 0,
    thumb: images[0]?.small ?? null,
    verification: entry.verification,
  })
}

index.sort((a, b) => a.names.az.localeCompare(b.names.az, 'az'))
entries.sort((a, b) => a.names.az.localeCompare(b.names.az, 'az'))

const LICENCE = {
  az: 'Məlumat bazası açıq mənbələrdən yığılıb. Wikidata faktları CC0 1.0, Vikipediyadan sitatlar CC BY-SA 4.0 (müəllifləri məqalə tarixçəsində), şəkillər hər faylın öz lisenziyası ilə (Wikimedia Commons). Toplu: CC BY-SA 4.0, mənbə göstərməklə.',
  en: 'Compiled from open sources. Wikidata facts CC0 1.0, Wikipedia excerpts CC BY-SA 4.0 (authors in the article history), images under each file’s own licence (Wikimedia Commons). Compilation: CC BY-SA 4.0 with attribution.',
}
const metaOut = {
  title: 'Ağıllı Toponim Atlası — açıq toponim arxivi',
  url: 'https://top.munsif.im/#/arxiv',
  retrieved: RETRIEVED,
  count: entries.length,
  licence: LICENCE,
  method: 'scripts/archive (fetch.mjs → build.mjs); selection rules in scripts/archive/config.mjs',
  note: 'Heç bir qeyd hələ ekspert tərəfindən təsdiqlənməyib. Not yet reviewed by experts.',
}

rmSync(join(OUT, 'entries'), { recursive: true, force: true })
mkdirSync(join(OUT, 'entries'), { recursive: true })
mkdirSync(PUB, { recursive: true })
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ meta: metaOut, items: index }))
writeFileSync(
  join(OUT, 'summary.json'),
  JSON.stringify({
    count: entries.length,
    forms: entries.reduce((a, e) => a + e.forms.length, 0),
    etymology: entries.filter((e) => e.etymology.length).length,
    images: entries.filter((e) => e.images.length).length,
    sources: entries.reduce((a, e) => a + e.sources.length, 0),
    sourced: entries.filter((e) => e.verification === 'sourced').length,
    retrieved: RETRIEVED,
  }) + '\n',
)
for (const e of entries) writeFileSync(join(OUT, 'entries', `${e.id}.json`), JSON.stringify(e))
writeFileSync(join(PUB, 'toponim-arxiv.json'), JSON.stringify({ meta: metaOut, items: entries }, null, 1))

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const fmtForm = (f) => f.form + (f.from || f.to ? ` (${f.from ?? ''}–${f.to ?? ''})` : '')
const cols = ['id', 'wikidata', 'name_az', 'name_ru', 'name_en', 'type', 'category', 'economic_region', 'lat', 'lon', 'first_record_year', 'first_record_kind', 'former_names', 'named_after', 'verification', 'wikipedia_az', 'wikipedia_ru', 'wikipedia_en', 'image', 'image_licence', 'image_author']
const rows = entries.map((e) => [
  e.id, e.qid, e.names.az, e.names.ru, e.names.en, e.type, e.category, e.region ?? '', e.coordinates[1], e.coordinates[0],
  e.firstRecord?.year ?? '', e.firstRecord?.kind ?? '', e.forms.map(fmtForm).join(' | '), e.namedAfter.map((n) => n.az || n.en).join(' | '), e.verification,
  e.sources.find((s) => s.id === 'wp-az')?.pageUrl ?? '', e.sources.find((s) => s.id === 'wp-ru')?.pageUrl ?? '', e.sources.find((s) => s.id === 'wp-en')?.pageUrl ?? '',
  e.images[0]?.page ?? '', e.images[0]?.license ?? '', e.images[0]?.artist ?? '',
])
writeFileSync(join(PUB, 'toponim-arxiv.csv'), '\ufeff' + [cols, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n')

// ---------- report ----------
const n = (f) => entries.filter(f).length
console.log(
  JSON.stringify(
    {
      entries: entries.length,
      byType: Object.fromEntries([...new Set(entries.map((e) => e.type))].map((t) => [t, n((e) => e.type === t)])),
      sourced: n((e) => e.verification === 'sourced'),
      review: n((e) => e.verification === 'review'),
      withEtymology: n((e) => e.etymology.length),
      withForms: n((e) => e.forms.length),
      withFirstRecord: n((e) => e.firstRecord),
      withRegion: n((e) => e.region),
      withImage: n((e) => e.images.length),
      forms: entries.reduce((a, e) => a + e.forms.length, 0),
    },
    null,
    1,
  ),
)
