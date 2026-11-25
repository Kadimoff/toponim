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
}: {
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
  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const results = useResults(query, filters)
  const selected = id ? BY_ID.get(id) : undefined
  const [snap, setSnap] = useState<Snap>(selected ? 'half' : 'peek')
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
    const s = new Set(results.map((r) => r.id))
    if (selected) s.add(selected.id)
    return s
  }, [results, selected])

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

  // typing in search on mobile should reveal results
  useEffect(() => {
    if (isMobile && query && snap === 'peek') setSnap('half')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const padding = useMemo(
    () =>
      isMobile
        ? { top: 16, left: 16, right: 16, bottom: snap === 'peek' ? 184 : Math.min(Math.round(h * 0.56) + 12, h - 160) }
        : { top: 40, left: 420, right: selected ? 500 : 40, bottom: 40 },
    [isMobile, h, selected, snap],
  )

  const pinLabel = useCallback((name: string) => t.atlas.pinLabel(name), [t])
  const mapLabels = useMemo(
    () => ({ loading: t.atlas.mapLoading, fallback: t.atlas.mapFallback, zoomIn: t.atlas.zoomIn, zoomOut: t.atlas.zoomOut }),
    [t],
  )

  const list = (
    <ListBody
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

  const notFound = id && !selected

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden">
      <h1 className="sr-only">{t.nav.atlas}</h1>
      <MapCanvas
        toponyms={TOPONYMS}
        visibleIds={visibleIds}
        selectedId={selected?.id}
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
            <div className="flex items-center border-t px-4 py-2" style={{ borderColor: 'var(--line)' }}>
              <SampleBadge />
            </div>
          </aside>

          <AnimatePresence>
            {(selected || notFound) && (
              <m.aside
                key="detail"
                aria-label={selected?.names[lang]}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="glass absolute top-4 right-4 bottom-4 z-10 w-[min(460px,calc(100%-420px))] overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {selected ? (
                  <DetailCard t={selected} onClose={close} />
                ) : (
                  <NotFound onClose={close} text={t.detail.notFound} closeLabel={t.detail.close} />
                )}
              </m.aside>
            )}
          </AnimatePresence>
        </>
      )}

      {isMobile && (
        <BottomSheet snap={snap} setSnap={setSnap} height={h}>
          {selected ? (
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
