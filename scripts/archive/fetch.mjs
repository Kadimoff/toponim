#!/usr/bin/env node
// Fills data/archive-cache/ from public open sources (network). The site build never calls this:
// `npm run data:build` turns the committed cache into src/data/archive.json offline.
//
//   node scripts/archive/fetch.mjs            # fetch only what is missing in the cache
//   node scripts/archive/fetch.mjs --refresh  # re-fetch everything
//
// Sources: Wikidata (CC0) via query.wikidata.org, Wikipedia AZ/RU/EN (CC BY-SA 4.0) via the MediaWiki API,
// Wikimedia Commons file metadata (per-file licences). Only trimmed pieces are cached (intro, name/etymology
// sections, a few infobox fields, revision ids) so the cache stays small and every quote stays citable.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SELECTION, NAME_HEADINGS, INFOBOX_FIELDS } from './config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, 'data', 'archive-cache')
const REFRESH = process.argv.includes('--refresh')
const UA = 'ToponimAtlasDataBuild/1.0 (https://top.munsif.im; open toponym archive build script)'
mkdirSync(CACHE, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d)
const writeJson = (f, v) => {
  mkdirSync(dirname(f), { recursive: true })
  writeFileSync(f, JSON.stringify(v, null, 1) + '\n')
}

async function get(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(60000) })
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status)
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
      return await r.json()
    } catch (e) {
      if (i === tries - 1) throw e
      await sleep(1500 * (i + 1))
    }
  }
}

async function sparql(query) {
  const d = await get('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query))
  return d.results.bindings.map((b) => {
    const o = {}
    for (const [k, v] of Object.entries(b)) {
      o[k] = v.value.replace('http://www.wikidata.org/entity/', '')
      if (v['xml:lang']) o[k + '_lang'] = v['xml:lang']
    }
    return o
  })
}

// ---------- 1. Wikidata: candidates per category ----------
async function candidates() {
  const file = join(CACHE, 'wikidata-candidates.json')
  if (!REFRESH && existsSync(file)) return readJson(file)
  const out = {}
  for (const sel of SELECTION) {
    const values = sel.classes.map((c) => 'wd:' + c).join(' ')
    const rows = await sparql(`
SELECT ?i ?sl ?az ?ru ?en ?coord ?img ?azw ?ruw ?enw ?adm ?admAz ?admEn WHERE {
  VALUES ?cls { ${values} }
  ?i wdt:P31 ?cls ; wdt:P17 wd:Q227 ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
  OPTIONAL { ?i rdfs:label ?az FILTER(LANG(?az)="az") }
  OPTIONAL { ?i rdfs:label ?ru FILTER(LANG(?ru)="ru") }
  OPTIONAL { ?i rdfs:label ?en FILTER(LANG(?en)="en") }
  OPTIONAL { ?i wdt:P18 ?img }
  OPTIONAL { ?azw schema:about ?i ; schema:isPartOf <https://az.wikipedia.org/> }
  OPTIONAL { ?ruw schema:about ?i ; schema:isPartOf <https://ru.wikipedia.org/> }
  OPTIONAL { ?enw schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?i wdt:P131 ?adm . OPTIONAL { ?adm rdfs:label ?admAz FILTER(LANG(?admAz)="az") } OPTIONAL { ?adm rdfs:label ?admEn FILTER(LANG(?admEn)="en") } }
}`)
    out[sel.category] = rows
    console.log('wikidata', sel.category, rows.length)
    await sleep(1200)
  }
  writeJson(file, out)
  return out
}

// ---------- 2. Wikidata: statements for the chosen items ----------
async function statements(qids) {
  const file = join(CACHE, 'wikidata-statements.json')
  const have = REFRESH ? {} : readJson(file, {})
  const todo = qids.filter((q) => !have[q])
  for (let k = 0; k < todo.length; k += 40) {
    const chunk = todo.slice(k, k + 40)
    const vals = chunk.map((q) => 'wd:' + q).join(' ')
    const names = await sparql(`
SELECT ?i ?name ?start ?end WHERE { VALUES ?i { ${vals} }
  ?i p:P1448 ?st . ?st ps:P1448 ?name .
  OPTIONAL { ?st pq:P580 ?start } OPTIONAL { ?st pq:P582 ?end } }`)
    await sleep(800)
    const times = []
    for (const prop of ['P571', 'P1249']) {
      const rows = await sparql(`
SELECT ?i ?t ?prec WHERE { VALUES ?i { ${vals} }
  ?i p:${prop} ?st . ?st psv:${prop} ?tv . ?tv wikibase:timeValue ?t ; wikibase:timePrecision ?prec . }`)
      times.push(...rows.map((r) => ({ ...r, prop })))
      await sleep(500)
    }
    await sleep(800)
    const named = await sparql(`
SELECT ?i ?n ?nAz ?nEn WHERE { VALUES ?i { ${vals} } ?i wdt:P138 ?n .
  OPTIONAL { ?n rdfs:label ?nAz FILTER(LANG(?nAz)="az") } OPTIONAL { ?n rdfs:label ?nEn FILTER(LANG(?nEn)="en") } }`)
    await sleep(800)
    for (const q of chunk) {
      have[q] = {
        officialNames: names.filter((r) => r.i === q).map((r) => ({ name: r.name, lang: r.name_lang, start: r.start, end: r.end })),
        times: times.filter((r) => r.i === q).map((r) => ({ prop: r.prop, time: r.t, precision: Number(r.prec) })),
        namedAfter: named.filter((r) => r.i === q).map((r) => ({ qid: r.n, az: r.nAz, en: r.nEn })),
      }
    }
    writeJson(file, have)
    console.log('statements', Math.min(k + 40, todo.length), '/', todo.length)
  }
  return have
}

// ---------- 3. Wikipedia: intro + name sections + infobox fields ----------
function splitSections(text) {
  // explaintext + exsectionformat=wiki → "== Heading ==" lines
  const lines = text.split('\n')
  const intro = []
  const secs = []
  let cur = null
  for (const ln of lines) {
    const m = ln.match(/^(={2,6})\s*(.*?)\s*\1\s*$/)
    if (m) {
      cur = { level: m[1].length, heading: m[2], body: [] }
      secs.push(cur)
    } else if (cur) cur.body.push(ln)
    else intro.push(ln)
  }
  return { intro: intro.join('\n').trim(), secs }
}

function nameSections(lang, secs) {
  const re = NAME_HEADINGS[lang]
  const out = []
  for (let i = 0; i < secs.length; i++) {
    const s = secs[i]
    if (!re.include.test(s.heading) || re.exclude.test(s.heading)) continue
    // include sub-sections
    let body = s.body.join('\n')
    for (let j = i + 1; j < secs.length && secs[j].level > s.level; j++) body += `\n${secs[j].heading}.\n` + secs[j].body.join('\n')
    body = body.replace(/\n{3,}/g, '\n\n').trim()
    if (body.length > 40) out.push({ heading: s.heading, text: body.slice(0, 4000) })
  }
  return out
}

function infobox(lang, wikitext) {
  const fields = INFOBOX_FIELDS[lang]
  if (!fields) return {}
  const out = {}
  for (const [key, names] of Object.entries(fields)) {
    for (const n of names) {
      const m = wikitext.match(new RegExp('\\n\\s*\\|\\s*' + n + '\\s*=([^\\n]*)', 'i'))
      // drop footnotes before trimming: they are long and carry no name data
      const v = m ? m[1].replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '').trim() : ''
      if (v) {
        out[key] = v.slice(0, 800)
        break
      }
    }
  }
  return out
}

async function wiki(lang, titles) {
  const file = join(CACHE, `wikipedia-${lang}.json`)
  const have = REFRESH ? {} : readJson(file, {})
  const todo = titles.filter((t) => !have[t])
  let n = 0
  for (const title of todo) {
    const api = `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&redirects=1&action=query`
    const ex = await get(`${api}&prop=extracts|revisions&explaintext=1&exsectionformat=wiki&rvprop=ids|timestamp&titles=${encodeURIComponent(title)}`)
    const p = ex.query.pages[0]
    if (p.missing) {
      have[title] = { missing: true }
      continue
    }
    const { intro, secs } = splitSections(p.extract || '')
    let box = {}
    if (INFOBOX_FIELDS[lang]) {
      const wt = await get(`${api}&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(title)}`)
      box = infobox(lang, wt.query.pages[0].revisions?.[0]?.slots?.main?.content ?? '')
      await sleep(150)
    }
    have[title] = {
      title: p.title,
      revid: p.revisions?.[0]?.revid,
      revTimestamp: p.revisions?.[0]?.timestamp,
      intro: intro.slice(0, 1500),
      sections: nameSections(lang, secs),
      infobox: box,
    }
    if (++n % 10 === 0) {
      writeJson(file, have)
      console.log('wikipedia', lang, n, '/', todo.length)
    }
    await sleep(150)
  }
  writeJson(file, have)
  return have
}

// ---------- 4. Commons: image licences ----------
async function commons(files) {
  const file = join(CACHE, 'commons.json')
  const have = REFRESH ? {} : readJson(file, {})
  const todo = files.filter((f) => !have[f])
  for (let k = 0; k < todo.length; k += 40) {
    const chunk = todo.slice(k, k + 40)
    const d = await get(
      'https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&action=query&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|UsageTerms|Credit|AttributionRequired|ImageDescription&titles=' +
        encodeURIComponent(chunk.map((f) => 'File:' + f).join('|')),
    )
    const norm = Object.fromEntries((d.query.normalized || []).map((x) => [x.to, x.from]))
    for (const p of d.query.pages) {
      const ii = p.imageinfo?.[0]
      const key = (norm[p.title] || p.title).replace(/^File:/, '')
      if (!ii) {
        have[key] = { missing: true }
        continue
      }
      const md = ii.extmetadata || {}
      const v = (k) => md[k]?.value
      have[key] = {
        title: p.title,
        page: ii.descriptionurl,
        thumb: ii.thumburl,
        thumbWidth: ii.thumbwidth,
        thumbHeight: ii.thumbheight,
        artist: v('Artist'),
        credit: v('Credit'),
        license: v('LicenseShortName'),
        licenseUrl: v('LicenseUrl'),
        usageTerms: v('UsageTerms'),
        attributionRequired: v('AttributionRequired'),
        description: (v('ImageDescription') || '').slice(0, 600),
      }
    }
    writeJson(file, have)
    console.log('commons', Math.min(k + 40, todo.length), '/', todo.length)
    await sleep(600)
  }
  return have
}

// ---------- 5. Economic regions → member districts (AZ Wikipedia table, 2021 division) ----------
async function regionTable() {
  const file = join(CACHE, 'regions-az.json')
  if (!REFRESH && existsSync(file)) return
  const title = 'Azərbaycanın iqtisadi rayonları'
  const d = await get(`https://az.wikipedia.org/w/api.php?format=json&formatversion=2&redirects=1&action=query&prop=revisions&rvprop=content|ids|timestamp&rvslots=main&titles=${encodeURIComponent(title)}`)
  const p = d.query.pages[0]
  const wt = p.revisions[0].slots.main.content
  const table = wt.slice(wt.indexOf('{|'), wt.indexOf('|}') + 2).replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  writeJson(file, { title: p.title, revid: p.revisions[0].revid, revTimestamp: p.revisions[0].timestamp, table })
}

// ---------- run ----------
const { pick } = await import('./select.mjs')
const cand = await candidates()
const items = pick(cand)
console.log('selected', items.length)
await statements(items.map((x) => x.qid))
for (const lang of ['az', 'ru', 'en']) {
  const titles = items.map((x) => x.wiki[lang]).filter(Boolean)
  await wiki(lang, titles)
}
await commons(items.map((x) => x.image).filter(Boolean))
await regionTable()
writeJson(join(CACHE, 'meta.json'), { fetchedAt: new Date().toISOString().slice(0, 10), userAgent: UA })
console.log('done')
