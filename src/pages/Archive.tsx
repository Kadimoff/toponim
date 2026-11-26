import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Download, Image as ImageIcon, Map as MapIcon, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../i18n'
import { useArc } from '../i18n/arc'
import {
  ARCHIVE,
  ARC_META,
  applyArcFilters,
  arcFilterCount,
  emptyArcFilters,
  filtersFromQuery,
  filtersToQuery,
  searchArchive,
  type ArcFilters,
  type ArcIndexItem,
} from '../lib/archive'
import { href } from '../lib/router'
import { ArcFilterBar, ArcSearchBox, VerificationChip, useMetaLine } from '../components/archive/Filters'
import { EntryView } from '../components/archive/EntryView'
import { PinMark } from '../components/PinMark'
import { Footer } from '../components/Footer'

const N_FORMS = ARCHIVE.reduce((n, x) => n + x.forms.length, 0)
const N_ETYM = ARCHIVE.filter((x) => x.hasEtymology).length
const N_IMG = ARCHIVE.filter((x) => x.hasImage).length

export default function Archive({ id, query }: { id?: string; query?: string }) {
  if (id)
    return (
      <>
        <EntryView id={id} />
        <Footer />
      </>
    )
  return <Browser query={query ?? ''} />
}

function Browser({ query }: { query: string }) {
  const a = useArc()
  const { lang } = useI18n()
  const init = useMemo(() => filtersFromQuery(query), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [q, setQ] = useState(init.q)
  const [filters, setFilters] = useState<ArcFilters>(init.f)
  const [sort, setSort] = useState<'az' | 'old'>('az')
  const [open, setOpen] = useState(() => arcFilterCount(init.f) > 0 || window.innerWidth >= 1024)

  const results = useMemo(() => {
    const r = applyArcFilters(searchArchive(q), filters)
    if (q.trim()) return r // keep relevance order
    const byName = (x: ArcIndexItem, y: ArcIndexItem) => x.names[lang].localeCompare(y.names[lang], lang)
    return sort === 'old' ? [...r].sort((x, y) => (x.firstYear ?? 1e9) - (y.firstYear ?? 1e9) || byName(x, y)) : [...r].sort(byName)
  }, [q, filters, sort, lang])

  // shareable filtered view, without adding history entries
  useEffect(() => {
    const h = `#/arxiv${filtersToQuery(q, filters)}`
    if (location.hash !== h) history.replaceState(null, '', h)
  }, [q, filters])

  const nActive = arcFilterCount(filters)
  const reset = () => {
    setQ('')
    setFilters(emptyArcFilters())
  }

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-8 sm:px-6 lg:pt-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[46rem]">
            <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
              {a.title}
            </h1>
            <p className="mt-4 mb-0 text-[1.125rem]" style={{ color: 'var(--ink-soft)' }}>
              {a.lede(ARCHIVE.length)}
            </p>
            <p className="mt-3 mb-0 rounded-[12px] border border-dashed px-4 py-3 text-[0.9375rem]" style={{ borderColor: 'var(--line-strong)', color: 'var(--ink-soft)' }}>
              {a.honesty}{' '}
              <a href={href({ page: 'method' })} style={{ color: 'var(--link)' }}>
                {a.methodLink}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={href({ page: 'atlas' })} className="btn-primary h-11 px-5 text-[0.9375rem]">
              <MapIcon size={17} />
              {a.openMap}
            </a>
            <a href={href({ page: 'method' })} className="btn-quiet h-11 text-[0.9375rem]">
              <BookOpen size={17} />
              {a.methodLink}
            </a>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border lg:grid-cols-4" style={{ borderColor: 'var(--line)', background: 'var(--line)' }}>
          {[
            { n: ARCHIVE.length, l: a.nEntries },
            { n: N_FORMS, l: a.nForms },
            { n: N_ETYM, l: a.nEtym },
            { n: N_IMG, l: a.nImages },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse gap-1 p-5" style={{ background: 'var(--page)' }}>
              <dt className="text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
                {s.l}
              </dt>
              <dd className="tabular m-0 font-[family-name:var(--font-display)] text-[2.25rem] leading-none" style={{ color: 'var(--ink)' }}>
                {s.n}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label={a.searchLabel} className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <ArcSearchBox value={q} onChange={setQ} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls="arc-filters"
                className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[0.875rem] font-medium hover:bg-[var(--chip)]"
                style={{ color: 'var(--ink)' }}
              >
                <SlidersHorizontal size={16} aria-hidden />
                {a.filters}
                {nActive > 0 && (
                  <span className="tabular grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.75rem] font-semibold" style={{ background: '#8B5CF6', color: '#fff' }}>
                    {nActive}
                  </span>
                )}
              </button>
              <span className="ml-auto text-[0.875rem]" style={{ color: 'var(--ink-faint)' }} aria-live="polite">
                {a.results(results.length)}
              </span>
              {(nActive > 0 || q) && (
                <button type="button" onClick={reset} aria-label={a.reset} title={a.reset} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-[var(--chip)]" style={{ color: 'var(--ink-soft)' }}>
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
            {open && (
              <div id="arc-filters" className="glass p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <ArcFilterBar filters={filters} onChange={setFilters} compact />
              </div>
            )}
            <div className="glass p-4 text-[0.875rem]" style={{ boxShadow: 'var(--shadow-card)', color: 'var(--ink-soft)' }}>
              <div className="mb-2 flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                <Download size={16} aria-hidden />
                {a.download}
              </div>
              <div className="flex gap-2">
                <a href="/data/toponim-arxiv.json" download className="btn-quiet h-9 min-h-9 text-[0.8125rem]">
                  JSON
                </a>
                <a href="/data/toponim-arxiv.csv" download className="btn-quiet h-9 min-h-9 text-[0.8125rem]">
                  CSV
                </a>
              </div>
              <p className="mt-2 mb-0 text-[0.75rem]" style={{ color: 'var(--ink-faint)' }}>
                {lang === 'az' ? ARC_META.licence.az : ARC_META.licence.en}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            {!q.trim() && (
              <div className="mb-4 flex items-center justify-end gap-2 text-[0.875rem]">
                <label htmlFor="arc-sort" style={{ color: 'var(--ink-faint)' }}>
                  {a.sort}
                </label>
                <select
                  id="arc-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'az' | 'old')}
                  className="h-9 rounded-[10px] border px-2 outline-none focus:border-[#8B5CF6]"
                  style={{ background: 'var(--surface-sunk)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="az">{a.sortAz}</option>
                  <option value="old">{a.sortOld}</option>
                </select>
              </div>
            )}
            {results.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-16 text-center">
                <PinMark size={44} tone="muted" />
                <p className="mt-4 mb-1 font-[family-name:var(--font-display)] text-[1.25rem]" style={{ color: 'var(--ink)' }}>
                  {a.emptyTitle}
                </p>
                <p className="m-0 max-w-[40ch] text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
                  {a.emptyText}
                </p>
                <button type="button" onClick={reset} className="btn-quiet mt-5 text-[0.875rem]">
                  <RotateCcw size={15} />
                  {a.reset}
                </button>
              </div>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((it) => (
                  <li key={it.id}>
                    <Card it={it} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

function Card({ it }: { it: ArcIndexItem }) {
  const { lang } = useI18n()
  const a = useArc()
  const meta = useMetaLine()
  const forms = it.forms.filter((f) => f !== it.names[lang]).slice(0, 3)
  return (
    <a
      href={href({ page: 'archive', id: it.id })}
      className="glass group flex h-full gap-3 p-4 no-underline transition-[transform,border-color] duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="chip text-[0.75rem]">{a.types[it.type]}</span>
          <VerificationChip v={it.verification} small />
        </div>
        <h2 className="truncate text-[1.375rem] leading-tight" style={{ color: 'var(--ink)' }}>
          {it.names[lang]}
        </h2>
        <p className="mt-1 mb-0 truncate text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          {meta(it)}
        </p>
        {forms.length > 0 && (
          <p className="mt-2 mb-0 truncate font-[family-name:var(--font-display)] text-[0.9375rem] italic" style={{ color: 'var(--ink-soft)' }}>
            {forms.join(' · ')}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium" style={{ color: 'var(--link)' }}>
          {a.entry.full}
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
      {it.thumb ? (
        <img src={it.thumb} alt="" width={72} height={72} loading="lazy" decoding="async" className="h-[72px] w-[72px] shrink-0 rounded-[12px] object-cover" style={{ background: 'var(--surface-sunk)' }} />
      ) : (
        <span aria-hidden className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[12px]" style={{ background: 'var(--surface-sunk)', color: 'var(--ink-faint)' }}>
          <ImageIcon size={20} />
        </span>
      )}
    </a>
  )
}
