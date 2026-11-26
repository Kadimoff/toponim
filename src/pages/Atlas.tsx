import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, m, useDragControls, useMotionValue } from 'framer-motion'
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../i18n'
import { BY_ID, TOPONYMS, type Toponym } from '../lib/data'
import { search } from '../lib/search'
import { navigate } from '../lib/router'
import { useIsMobile } from '../hooks/useReducedMotion'
import { MapCanvas } from '../components/map/MapCanvas'
import { DetailCard } from '../components/atlas/DetailCard'
import { FilterBar, ResultList, SearchBox, emptyFilters, filtersActive, type Filters } from '../components/atlas/ExplorerPanel'
import { SampleBadge } from '../components/Shell'
import { useArc } from '../i18n/arc'
import { ARCHIVE, ARC_BY_ID, applyArcFilters, arcFilterCount, emptyArcFilters, searchArchive, type ArcFilters, type ArcIndexItem } from '../lib/archive'
import { href } from '../lib/router'
import { ArcFilterBar, ArcListItem, ArcSearchBox } from '../components/archive/Filters'
import { EntryView } from '../components/archive/EntryView'
import type { MapPoint } from '../components/map/MapCanvas'

type Dataset = 'archive' | 'demo'
const ARC_POINTS: MapPoint[] = ARCHIVE.map((t) => ({ id: t.id, names: t.names, coordinates: t.coordinates, status: t.verification === 'sourced' ? 'verified' : 'pending' }))

function DatasetSwitch({ value, onChange }: { value: Dataset; onChange: (d: Dataset) => void }) {
  const a = useArc()
  return (
    <div role="radiogroup" aria-label={a.atlas.dataset} className="grid grid-cols-2 rounded-[10px] border p-0.5" style={{ borderColor: 'var(--line)' }}>
      {(['archive', 'demo'] as Dataset[]).map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          onClick={() => onChange(d)}
          className="h-9 rounded-[8px] px-2 text-[0.8125rem] font-medium transition-colors duration-150"
          style={{ background: value === d ? 'var(--chip)' : 'transparent', color: value === d ? 'var(--ink)' : 'var(--ink-faint)', boxShadow: value === d ? 'inset 0 0 0 1px var(--line-strong)' : undefined }}
        >
          {d === 'archive' ? `${a.atlas.archive} · ${ARCHIVE.length}` : `${a.atlas.demo} · ${TOPONYMS.length}`}
        </button>
      ))}
    </div>
  )
}

function ArchiveListBody({
  query,
  setQuery,
  filters,
  setFilters,
  results,
  selectedId,
  onSelect,
  filtersOpenDefault,
  dataset,
  setDataset,
}: {
  query: string
  setQuery: (q: string) => void
  filters: ArcFilters
  setFilters: (f: ArcFilters) => void
  results: ArcIndexItem[]
  selectedId?: string
  onSelect: (id: string) => void
  filtersOpenDefault: boolean
  dataset: Dataset
  setDataset: (d: Dataset) => void
}) {
  const a = useArc()
  const [open, setOpen] = useState(filtersOpenDefault)
  const active = arcFilterCount(filters)
  const reset = () => {
    setQuery('')
    setFilters(emptyArcFilters())
  }
  return (
    <>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <DatasetSwitch value={dataset} onChange={setDataset} />
        <ArcSearchBox value={query} onChange={setQuery} id="atlas-arc-search" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="arc-filter-body"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[0.875rem] font-medium transition-colors duration-150 hover:bg-[var(--chip)]"
            style={{ color: 'var(--ink)' }}
          >
            <SlidersHorizontal size={16} aria-hidden />
            {a.filters}
            {active > 0 && (
              <span className="tabular grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.75rem] font-semibold" style={{ background: '#8B5CF6', color: '#fff' }}>
                {active}
              </span>
            )}
            <ChevronDown size={15} aria-hidden className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
          </button>
          <span className="ml-auto text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }} aria-live="polite">
            {a.results(results.length)}
          </span>
          {(active > 0 || query) && (
            <button type="button" onClick={reset} aria-label={a.reset} title={a.reset} className="grid h-9 w-9 place-items-center rounded-[10px] transition-colors duration-150 hover:bg-[var(--chip)]" style={{ color: 'var(--ink-soft)' }}>
              <RotateCcw size={15} />
            </button>
          )}
        </div>
        {open && (
          <div id="arc-filter-body" className="max-h-[42vh] overflow-y-auto pb-1">
            <ArcFilterBar filters={filters} onChange={setFilters} compact />
          </div>
        )}
      </div>
      <div className="mx-4 mt-3 h-px shrink-0" style={{ background: 'var(--line)' }} />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {results.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <p className="mb-1 font-[family-name:var(--font-display)] text-[1.25rem]" style={{ color: 'var(--ink)' }}>
              {a.emptyTitle}
            </p>
            <p className="m-0 max-w-[32ch] text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
              {a.emptyText}
            </p>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {results.map((it) => (
              <li key={it.id}>
                <ArcListItem it={it} selected={it.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function Legend({ mobile }: { mobile: boolean }) {
  const a = useArc()
  const [open, setOpen] = useState(!mobile)
  const rows: [React.CSSProperties, string][] = [
    [{ background: '#6D28D9', border: '2px solid #DDD6FE' }, a.atlas.lSourced],
    [{ background: 'transparent', border: '2px dashed #8B5CF6' }, a.atlas.lReview],
    [{ background: '#F2B84B', border: '2px solid #FFF4DB' }, a.atlas.lSelected],
    [{ background: 'radial-gradient(circle at 35% 30%, #8b5cf6, #5b21b6)', border: '2px solid #DDD6FE', boxShadow: '0 0 0 3px rgba(139,92,246,0.28)' }, a.atlas.lCluster],
  ]
  return (
    <div className="glass px-3 py-2 text-[0.8125rem]" style={{ boxShadow: 'var(--shadow-card)', borderRadius: 12, color: 'var(--ink-soft)' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
        {a.atlas.legend}
        <ChevronDown size={14} aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
          {rows.map(([st, l]) => (
            <li key={l} className="flex items-center gap-2">
              <span className="legend-dot" style={st} aria-hidden />
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function useResults(query: string, filters: Filters): Toponym[] {
  return useMemo(() => {
    const base = search(query)
    return base.filter(
      (t) =>
        (!filters.types.size || filters.types.has(t.type)) &&
        (!filters.periods.size || filters.periods.has(t.period)) &&
        (!filters.statuses.size || filters.statuses.has(t.status)),
    )
  }, [query, filters])
}

function ListBody({
  query,
  setQuery,
  filters,
  setFilters,
  results,
  selectedId,
  onSelect,
  filtersOpenDefault,
  dataset,
  setDataset,
}: {
  dataset: Dataset
  setDataset: (d: Dataset) => void
  query: string
  setQuery: (q: string) => void
  filters: Filters
  setFilters: (f: Filters) => void
  results: Toponym[]
  selectedId?: string
  onSelect: (id: string) => void
  filtersOpenDefault: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(filtersOpenDefault)
  const active = filters.types.size + filters.periods.size + filters.statuses.size
  const reset = () => {
    setQuery('')
    setFilters(emptyFilters())
  }
  return (
    <>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <DatasetSwitch value={dataset} onChange={setDataset} />
        <SearchBox value={query} onChange={setQuery} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="filter-body"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[0.875rem] font-medium transition-colors duration-150 hover:bg-[var(--chip)]"
            style={{ color: 'var(--ink)' }}
          >
            <SlidersHorizontal size={16} aria-hidden />
            {t.atlas.filters}
            {active > 0 && (
              <span className="tabular grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.75rem] font-semibold" style={{ background: '#8B5CF6', color: '#fff' }}>
                {active}
              </span>
            )}
            <ChevronDown size={15} aria-hidden className="transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
          </button>
          <span className="ml-auto text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }} aria-live="polite">
            {t.atlas.results(results.length)}
          </span>
          {(filtersActive(filters) || query) && (
            <button
              type="button"
              onClick={reset}
              aria-label={t.atlas.reset}
              title={t.atlas.reset}
              className="grid h-9 w-9 place-items-center rounded-[10px] transition-colors duration-150 hover:bg-[var(--chip)]"
              style={{ color: 'var(--ink-soft)' }}
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              id="filter-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-1">
                <FilterBar filters={filters} onChange={setFilters} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mx-4 mt-3 h-px shrink-0" style={{ background: 'var(--line)' }} />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <ResultList items={results} selectedId={selectedId} onSelect={onSelect} onReset={reset} />
      </div>
    </>
  )
}

/* ---------------- Mobile bottom sheet ---------------- */
type Snap = 'peek' | 'half' | 'full'

function BottomSheet({ snap, setSnap, height, children }: { snap: Snap; setSnap: (s: Snap) => void; height: number; children: React.ReactNode }) {
  const { t } = useI18n()
  const controls = useDragControls()
  const full = height - 12
  const offsets: Record<Snap, number> = { full: 0, half: full - Math.round(height * 0.56), peek: full - 168 }
  const y = useMotionValue(offsets[snap])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const a = animate(y, offsets[snap], reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 42 })
    return () => a.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, height])

  return (
    <m.section
      aria-label={t.nav.atlas}
      className="glass absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden"
      style={{ height: full, y, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'var(--shadow-card)' }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: offsets.peek }}
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const cur = y.get() + info.velocity.y * 0.15
        const best = (Object.keys(offsets) as Snap[]).reduce((a, b) => (Math.abs(offsets[a] - cur) < Math.abs(offsets[b] - cur) ? a : b))
        setSnap(best)
        animate(y, offsets[best], { type: 'spring', stiffness: 420, damping: 42 })
      }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        onClick={() => setSnap(snap === 'full' ? 'peek' : snap === 'peek' ? 'half' : 'full')}
        aria-label={snap === 'peek' ? t.atlas.showList : t.atlas.hideList}
        className="flex h-7 w-full shrink-0 touch-none items-center justify-center"
      >
        <span className="h-1.5 w-11 rounded-full" style={{ background: 'var(--line-strong)' }} />
      </button>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </m.section>
  )
}

/* ---------------- Page ---------------- */
export default function Atlas({ id }: { id?: string }) {
  const { t, lang } = useI18n()
  const a = useArc()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const results = useResults(query, filters)
  const [arcQuery, setArcQuery] = useState('')
  const [arcFilters, setArcFilters] = useState<ArcFilters>(emptyArcFilters)
  const arcResults = useMemo(() => applyArcFilters(searchArchive(arcQuery), arcFilters), [arcQuery, arcFilters])
  const idDataset: Dataset | undefined = id ? (ARC_BY_ID.has(id) ? 'archive' : BY_ID.has(id) ? 'demo' : undefined) : undefined
  const [dataset, setDatasetState] = useState<Dataset>(idDataset ?? 'archive')
  useEffect(() => {
    if (idDataset) setDatasetState(idDataset)
  }, [idDataset])
  const arcSelected = dataset === 'archive' && id ? ARC_BY_ID.get(id) : undefined
  const selected = dataset === 'demo' && id ? BY_ID.get(id) : undefined
  const selItem = arcSelected ?? selected
  const [snap, setSnap] = useState<Snap>(selItem ? 'half' : 'peek')
  const wrap = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(() => Math.max(320, window.innerHeight - 64))

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visibleIds = useMemo(() => {
    const s = new Set((dataset === 'archive' ? arcResults : results).map((r) => r.id))
    if (selItem) s.add(selItem.id)
    return s
  }, [results, arcResults, selItem, dataset])

  const select = useCallback(
    (tid: string) => {
      navigate({ page: 'atlas', id: tid }, Boolean(id))
      if (isMobile) setSnap('half')
    },
    [id, isMobile],
  )
  const close = useCallback(() => {
    navigate({ page: 'atlas' }, true)
    if (isMobile) setSnap('peek')
  }, [isMobile])
  const setDataset = useCallback(
    (d: Dataset) => {
      setDatasetState(d)
      if (id) navigate({ page: 'atlas' }, true)
    },
    [id],
  )

  // typing in search on mobile should reveal results
  useEffect(() => {
    if (isMobile && (query || arcQuery) && snap === 'peek') setSnap('half')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, arcQuery])

  const padding = useMemo(
    () =>
      isMobile
        ? { top: 16, left: 16, right: 16, bottom: snap === 'peek' ? 184 : Math.min(Math.round(h * 0.56) + 12, h - 160) }
        : { top: 40, left: 420, right: selItem ? 500 : 40, bottom: 40 },
    [isMobile, h, selItem, snap],
  )

  const pinLabel = useCallback((name: string) => t.atlas.pinLabel(name), [t])
  const mapLabels = useMemo(
    () => ({ loading: t.atlas.mapLoading, fallback: t.atlas.mapFallback, zoomIn: t.atlas.zoomIn, zoomOut: t.atlas.zoomOut }),
    [t],
  )

  const list =
    dataset === 'archive' ? (
      <ArchiveListBody
        query={arcQuery}
        setQuery={setArcQuery}
        filters={arcFilters}
        setFilters={setArcFilters}
        results={arcResults}
        selectedId={arcSelected?.id}
        onSelect={select}
        filtersOpenDefault={false}
        dataset={dataset}
        setDataset={setDataset}
      />
    ) : (
    <ListBody
      dataset={dataset}
      setDataset={setDataset}
      query={query}
      setQuery={setQuery}
      filters={filters}
      setFilters={setFilters}
      results={results}
      selectedId={selected?.id}
      onSelect={select}
      filtersOpenDefault={!isMobile}
    />
  )

  const notFound = id && !selItem
  const clusterLabel = a.atlas.cluster

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden">
      <h1 className="sr-only">{t.nav.atlas}</h1>
      <MapCanvas
        toponyms={dataset === 'archive' ? ARC_POINTS : TOPONYMS}
        cluster={dataset === 'archive'}
        clusterLabel={clusterLabel}
        visibleIds={visibleIds}
        selectedId={selItem?.id}
        onSelect={select}
        lang={lang}
        padding={padding}
        pinLabel={pinLabel}
        labels={mapLabels}
      />

      {!isMobile && (
        <>
          <aside
            aria-label={t.atlas.searchLabel}
            className="glass absolute top-4 bottom-4 left-4 z-10 flex w-[380px] flex-col overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {list}
            <div className="flex items-center gap-2 border-t px-4 py-2 text-[0.8125rem]" style={{ borderColor: 'var(--line)', color: 'var(--ink-faint)' }}>
              {dataset === 'demo' ? (
                <>
                  <SampleBadge />
                  <span className="truncate">{a.atlas.demoNote}</span>
                </>
              ) : (
                <a href={href({ page: 'method' })} className="truncate" style={{ color: 'var(--link)' }}>
                  {a.methodLink}
                </a>
              )}
            </div>
          </aside>
          {dataset === 'archive' && (
            <div className="absolute bottom-4 left-[412px] z-10 w-[230px]">
              <Legend mobile={false} />
            </div>
          )}

          <AnimatePresence>
            {(selItem || notFound) && (
              <m.aside
                key="detail"
                aria-label={selItem?.names[lang]}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="glass absolute top-4 right-4 bottom-4 z-10 w-[min(460px,calc(100%-420px))] overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {arcSelected ? (
                  <EntryView id={arcSelected.id} compact onClose={close} />
                ) : selected ? (
                  <DetailCard t={selected} onClose={close} />
                ) : (
                  <NotFound onClose={close} text={t.detail.notFound} closeLabel={t.detail.close} />
                )}
              </m.aside>
            )}
          </AnimatePresence>
        </>
      )}

      {isMobile && dataset === 'archive' && (
        <div className="absolute top-3 left-3 z-10 max-w-[60vw]">
          <Legend mobile />
        </div>
      )}
      {isMobile && (
        <BottomSheet snap={snap} setSnap={setSnap} height={h}>
          {arcSelected ? (
            <EntryView id={arcSelected.id} compact onClose={close} />
          ) : selected ? (
            <DetailCard t={selected} onClose={close} />
          ) : notFound ? (
            <NotFound onClose={close} text={t.detail.notFound} closeLabel={t.detail.close} />
          ) : (
            list
          )}
        </BottomSheet>
      )}
    </div>
  )
}

function NotFound({ onClose, text, closeLabel }: { onClose: () => void; text: string; closeLabel: string }) {
  return (
    <div className="flex h-full flex-col items-start gap-4 p-6">
      <p className="m-0 text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
        {text}
      </p>
      <button type="button" className="btn-quiet" onClick={onClose}>
        {closeLabel}
      </button>
    </div>
  )
}
