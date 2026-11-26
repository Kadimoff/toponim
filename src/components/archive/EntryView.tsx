import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Copy, ExternalLink, Map as MapIcon, MapPin, Quote, Send, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useArc } from '../../i18n/arc'
import type { Lang } from '../../lib/data'
import { citeAPA, citeSource, formRange, formatWhen, loadEntry, permalink, suggestMailto, type ArcEntry, type SourceLang } from '../../lib/archive'
import { href } from '../../lib/router'
import { VerificationChip } from './Filters'

const MapCanvas = lazy(() => import('../map/MapCanvas').then((m) => ({ default: m.MapCanvas })))

export function useEntry(id: string | undefined) {
  const [state, setState] = useState<{ id?: string; entry: ArcEntry | null; loading: boolean }>({ entry: null, loading: !!id })
  useEffect(() => {
    if (!id) return
    let alive = true
    setState({ id, entry: null, loading: true })
    loadEntry(id)
      .then((e) => alive && setState({ id, entry: e, loading: false }))
      .catch(() => alive && setState({ id, entry: null, loading: false }))
    return () => {
      alive = false
    }
  }, [id])
  return state.id === id ? state : { entry: null, loading: !!id }
}

function useCopy() {
  const [st, setSt] = useState<'idle' | 'done' | 'fail'>('idle')
  const t = useRef(0)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSt('done')
    } catch {
      setSt('fail')
    }
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => setSt('idle'), 2200)
  }
  return [st, copy] as const
}

const H3 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h3 id={id} className="mb-3 font-[family-name:var(--font-sans)] text-[0.8125rem] font-semibold tracking-normal uppercase" style={{ color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
    {children}
  </h3>
)

function safeDecode(u: string) {
  try {
    return decodeURI(u)
  } catch {
    return u
  }
}

function pickLang<T>(rec: Partial<Record<SourceLang, T>>, lang: Lang): [SourceLang, T] | null {
  for (const l of [lang, 'az', 'ru', 'en'] as SourceLang[]) if (rec[l]) return [l, rec[l]!]
  return null
}

export function EntryView({ id, compact = false, onClose }: { id: string; compact?: boolean; onClose?: () => void }) {
  const { entry, loading } = useEntry(id)
  const a = useArc()
  if (loading)
    return (
      <div className="flex flex-col gap-3 p-6" role="status" aria-live="polite">
        <span className="sr-only">{a.entry.loading}</span>
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    )
  if (!entry)
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p className="m-0 text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
          {a.entry.notFound}
        </p>
        <a href={href({ page: 'archive' })} className="btn-quiet">
          {a.entry.back}
        </a>
      </div>
    )
  return <Entry e={entry} compact={compact} onClose={onClose} />
}

function Entry({ e, compact, onClose }: { e: ArcEntry; compact: boolean; onClose?: () => void }) {
  const a = useArc()
  const { lang, t } = useI18n()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [linkSt, copyLink] = useCopy()
  const [citeSt, copyCite] = useCopy()
  const [suggestSt, copySuggest] = useCopy()
  const srcNo = useMemo(() => new Map(e.sources.map((s, i) => [s.id, i + 1])), [e.sources])
  const others = (['az', 'ru', 'en'] as Lang[]).filter((l) => l !== lang && e.names[l] !== e.names[lang])
  const summary = pickLang(e.summary, lang)
  const etym = [...e.etymology].sort((x, y) => (x.lang === lang ? -1 : y.lang === lang ? 1 : 0))
  const url = permalink(e.id)
  const cite = citeAPA(e, lang)

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [e.id])
  useEffect(() => {
    if (!onClose) return
    const on = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])

  const Ref = ({ ids }: { ids: string[] }) => (
    <sup className="ml-0.5 whitespace-nowrap">
      {ids.map((s) => (
        <a key={s} href={compact ? href({ page: 'archive', id: e.id }) : `#src-${s}`} onClick={compact ? undefined : (ev) => {
          ev.preventDefault()
          document.getElementById(`src-${s}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }} className="tabular px-0.5 text-[0.75rem] no-underline hover:underline" style={{ color: 'var(--link)' }} aria-label={`${a.entry.sources} ${srcNo.get(s)}`}>
          [{srcNo.get(s)}]
        </a>
      ))}
    </sup>
  )

  const today = { form: e.names.az, lang: 'az', current: true }
  const formsShown = e.forms.some((f) => f.current) ? e.forms : e.forms.length ? [...e.forms, { ...today, sources: [] as string[] }] : []

  const header = (
    <header className={compact ? 'flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6' : 'flex flex-col gap-4'}>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="chip">{a.types[e.type]}</span>
          <span className="text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
            {a.categories[e.category]}
          </span>
          <VerificationChip v={e.verification} small={compact} />
        </div>
        {compact ? (
          <h2 ref={titleRef} tabIndex={-1} className="text-[2rem] leading-[1.1] outline-none sm:text-[2.25rem]" style={{ color: 'var(--ink)' }}>
            {e.names[lang]}
          </h2>
        ) : (
          <h1 ref={titleRef} tabIndex={-1} className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] outline-none sm:text-[3.5rem]" style={{ color: 'var(--ink)' }}>
            {e.names[lang]}
          </h1>
        )}
        {others.length > 0 && (
          <p className="mt-2 mb-0 flex flex-wrap gap-x-4 text-[1.0625rem]" style={{ color: 'var(--ink-soft)' }}>
            {others.map((l) => (
              <span key={l} lang={l}>
                <span className="mr-1.5 text-[0.75rem] font-semibold" style={{ color: 'var(--ink-faint)' }}>
                  {l.toUpperCase()}
                </span>
                {e.names[l]}
              </span>
            ))}
          </p>
        )}
      </div>
      {compact && onClose && (
        <button type="button" onClick={onClose} aria-label={t.detail.close} className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] transition-colors duration-200 hover:bg-[var(--chip)]" style={{ color: 'var(--ink-soft)' }}>
          <X size={20} />
        </button>
      )}
    </header>
  )

  const facts = (
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-[0.9375rem]">
      {e.firstRecord && (
        <div>
          <dt style={{ color: 'var(--ink-faint)' }} className="text-[0.8125rem]">
            {a.entry.kinds[e.firstRecord.kind]}
          </dt>
          <dd className="m-0 font-medium" style={{ color: 'var(--ink)' }}>
            <span className="tabular">{formatWhen(e.firstRecord, lang)}</span>
            <Ref ids={[e.firstRecord.source]} />
          </dd>
        </div>
      )}
      {e.region && (
        <div>
          <dt style={{ color: 'var(--ink-faint)' }} className="text-[0.8125rem]">
            {a.entry.region}
          </dt>
          <dd className="m-0 font-medium" style={{ color: 'var(--ink)' }}>
            {a.regions[e.region]}
            {e.regionSource && <Ref ids={[e.regionSource]} />}
          </dd>
        </div>
      )}
      {e.admin.length > 0 && (
        <div>
          <dt style={{ color: 'var(--ink-faint)' }} className="text-[0.8125rem]">
            {a.entry.admin}
          </dt>
          <dd className="m-0 font-medium" style={{ color: 'var(--ink)' }}>
            {e.admin.map((x) => (lang === 'az' ? x.az : x.en)).join(', ')}
            <Ref ids={['wd']} />
          </dd>
        </div>
      )}
      {e.namedAfter.length > 0 && (
        <div>
          <dt style={{ color: 'var(--ink-faint)' }} className="text-[0.8125rem]">
            {a.entry.namedAfter}
          </dt>
          <dd className="m-0 font-medium" style={{ color: 'var(--ink)' }}>
            {e.namedAfter.map((n) => (lang === 'az' ? n.az || n.en : n.en || n.az)).join(', ')}
            <Ref ids={['wd']} />
          </dd>
        </div>
      )}
      <div className="col-span-2 flex items-center gap-2" style={{ color: 'var(--ink-soft)' }}>
        <MapPin size={15} aria-hidden />
        <span className="sr-only">{a.entry.coords}: </span>
        <span className="tabular">
          {e.coordinates[1].toFixed(4)}° N, {e.coordinates[0].toFixed(4)}° E
        </span>
        <Ref ids={[e.coordinatesSource]} />
      </div>
    </dl>
  )

  const summaryBlock = summary && (
    <section aria-labelledby={`sum-${e.id}`}>
      <H3 id={`sum-${e.id}`}>{a.entry.summary}</H3>
      <blockquote className="prose-quote m-0 border-l-2 pl-4 text-[1rem] leading-relaxed" style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }} lang={summary[0]}>
        {compact && summary[1].text.length > 320 ? summary[1].text.slice(0, 320).replace(/\s+\S*$/, '') + ' …' : summary[1].text}
        <Ref ids={[summary[1].source]} />
      </blockquote>
      {summary[0] !== lang && (
        <p className="mt-1 mb-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          {a.entry.quote} · {a.inLang[summary[0]]}
        </p>
      )}
    </section>
  )

  const formsBlock = (
    <section aria-labelledby={`forms-${e.id}`}>
      <H3 id={`forms-${e.id}`}>{a.entry.forms}</H3>
      {formsShown.length === 0 ? (
        <p className="m-0 text-[0.9375rem]" style={{ color: 'var(--ink-faint)' }}>
          {a.entry.formsNone}
        </p>
      ) : (
        <ol className="relative m-0 list-none p-0">
          {formsShown.map((f, i) => {
            const last = i === formsShown.length - 1
            return (
              <li key={i} className="relative grid grid-cols-[6.5rem_1fr] gap-3 pb-3 last:pb-0">
                <span className="tabular pt-0.5 text-right text-[0.8125rem] font-semibold" style={{ color: last ? 'var(--gold-ink-on)' : 'var(--ink-soft)' }}>
                  {f.current && !formRange(f) ? a.entry.today : formRange(f) || '—'}
                </span>
                <span className="relative border-l-2 pl-4" style={{ borderColor: last ? '#F2B84B' : 'rgba(139,92,246,0.6)' }}>
                  <span aria-hidden className="absolute top-1.5 -left-[7px] h-3 w-3 rounded-full" style={{ background: last ? '#F2B84B' : 'var(--page)', border: `2px solid ${last ? '#F2B84B' : '#8B5CF6'}` }} />
                  <span className="font-[family-name:var(--font-display)] text-[1.125rem] italic" style={{ color: 'var(--ink)' }} lang={f.lang}>
                    {f.form}
                  </span>
                  <span className="ml-2 text-[0.75rem] font-semibold uppercase" style={{ color: 'var(--ink-faint)' }}>
                    {f.lang}
                  </span>
                  {f.sources.length > 0 && <Ref ids={f.sources} />}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )

  const etymBlock = (
    <section aria-labelledby={`etym-${e.id}`}>
      <H3 id={`etym-${e.id}`}>{a.entry.etymology}</H3>
      {etym.length === 0 ? (
        <p className="m-0 text-[0.9375rem]" style={{ color: 'var(--ink-faint)' }}>
          {a.entry.etymNone}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {(compact ? etym.slice(0, 1) : etym).map((x) => {
            const src = e.sources.find((s) => s.id === x.source)
            const text = compact && x.text.length > 380 ? x.text.slice(0, 380).replace(/\s+\S*$/, '') + ' …' : x.text
            return (
              <figure key={x.lang} className="m-0">
                <blockquote className="prose-quote m-0 border-l-2 pl-4 text-[1rem] leading-relaxed" style={{ borderColor: 'rgba(139,92,246,0.6)', color: 'var(--ink)' }} lang={x.lang}>
                  <Quote size={14} aria-hidden className="mr-1 inline align-[-2px]" style={{ color: 'var(--ink-faint)' }} />
                  {text}
                  <Ref ids={[x.source]} />
                </blockquote>
                <figcaption className="mt-1.5 flex flex-wrap gap-x-3 pl-4 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                  <span>
                    {src?.publisher} · «{x.heading}»{(x.truncated || text !== x.text) && ` · ${a.entry.truncated}`}
                  </span>
                  {src?.pageUrl && !compact && (
                    <a href={`${src.pageUrl}#${encodeURIComponent(x.anchor)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: 'var(--link)' }}>
                      {a.entry.readFull}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </figcaption>
              </figure>
            )
          })}
          <p className="m-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
            {a.entry.etymNote}
          </p>
        </div>
      )}
    </section>
  )

  const shareBtn = (
    <button type="button" onClick={() => copyLink(url)} className="btn-quiet h-10 min-h-10 text-[0.875rem]" aria-live="polite">
      {linkSt === 'done' ? <Check size={16} /> : <Copy size={16} />}
      {linkSt === 'done' ? a.entry.copied : linkSt === 'fail' ? a.entry.copyFail : a.entry.share}
    </button>
  )

  if (compact)
    return (
      <article aria-label={e.names[lang]} className="flex h-full flex-col">
        {header}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 pb-5 sm:px-6">
          {facts}
          {summaryBlock}
          {formsBlock}
          {etymBlock}
        </div>
        <footer className="flex flex-wrap items-center gap-2 border-t px-5 py-3 sm:px-6" style={{ borderColor: 'var(--line)' }}>
          <a href={href({ page: 'archive', id: e.id })} className="btn-primary h-10 min-h-10 px-4 text-[0.875rem]">
            {a.entry.full}
            <ArrowUpRight size={16} />
          </a>
          {shareBtn}
        </footer>
      </article>
    )

  const subject = a.entry.suggestSubject(e.names.az)
  const body = a.entry.suggestBody(e.names[lang], url)

  return (
    <article className="mx-auto max-w-[1320px] px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <nav aria-label="breadcrumb" className="mb-6">
        <a href={href({ page: 'archive' })} className="inline-flex items-center gap-2 text-[0.9375rem] no-underline hover:underline" style={{ color: 'var(--link)' }}>
          <ArrowLeft size={16} aria-hidden />
          {a.entry.back}
        </a>
      </nav>
      {header}
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          <div className="lg:hidden">{facts}</div>
          {summaryBlock}
          {formsBlock}
          {etymBlock}

          <section aria-labelledby="media-h">
            <H3 id="media-h">{a.entry.media}</H3>
            {e.images.length === 0 ? (
              <p className="m-0 text-[0.9375rem]" style={{ color: 'var(--ink-faint)' }}>
                {a.entry.mediaNone}
              </p>
            ) : (
              e.images.map((im) => (
                <figure key={im.page} className="m-0">
                  <img
                    src={im.thumb}
                    width={im.width}
                    height={im.height}
                    alt={e.names[lang]}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto max-h-[440px] w-full rounded-[14px] object-cover"
                    style={{ background: 'var(--surface-sunk)' }}
                  />
                  <figcaption className="mt-2 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                    {im.artist && (
                      <>
                        {a.entry.author}: {im.artist} ·{' '}
                      </>
                    )}
                    {im.licenseUrl ? (
                      <a href={im.licenseUrl} target="_blank" rel="noopener noreferrer license" style={{ color: 'var(--link)' }}>
                        {im.license}
                      </a>
                    ) : (
                      im.license
                    )}{' '}
                    ·{' '}
                    <a href={im.page} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>
                      Wikimedia Commons
                    </a>
                    <Ref ids={[im.source]} />
                  </figcaption>
                </figure>
              ))
            )}
          </section>

          <section aria-labelledby="src-h">
            <H3 id="src-h">{a.entry.sources}</H3>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {e.sources.map((s, i) => (
                <li key={s.id} id={`src-${s.id}`} className="grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] gap-2 text-[0.9375rem] [overflow-wrap:anywhere]">
                  <span className="tabular font-semibold" style={{ color: 'var(--ink-faint)' }}>
                    [{i + 1}]
                  </span>
                  <span className="min-w-0" style={{ color: 'var(--ink)' }}>
                    <span className="font-medium">{s.publisher}</span>: «{s.title}»
                    <span className="block text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all" style={{ color: 'var(--link)' }}>
                        {s.kind === 'wikipedia' ? `${a.entry.permanent} (${s.revDate})` : safeDecode(s.url).replace(/^https:\/\//, '')}
                      </a>{' '}
                      · {a.entry.licence}: {s.licence} · {a.entry.retrieved} {s.retrieved}
                    </span>
                    <span className="mt-1 block text-[0.75rem]" style={{ color: 'var(--ink-faint)' }}>
                      {citeSource(s)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-label={a.entry.map} className="glass overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="relative h-[260px]">
              <Suspense fallback={<div className="skeleton absolute inset-0 rounded-none" />}>
                <MapCanvas
                  toponyms={[{ id: e.id, names: e.names, coordinates: e.coordinates, status: e.verification === 'sourced' ? 'verified' : 'pending' }]}
                  selectedId={e.id}
                  lang={lang}
                  padding={{ top: 30, right: 30, bottom: 30, left: 30 }}
                  pinLabel={(n) => n}
                  labels={{ loading: t.atlas.mapLoading, fallback: t.atlas.mapFallback, zoomIn: t.atlas.zoomIn, zoomOut: t.atlas.zoomOut }}
                />
              </Suspense>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {facts}
              <a href={href({ page: 'atlas', id: e.id })} className="btn-quiet h-10 min-h-10 self-start text-[0.875rem]">
                <MapIcon size={16} />
                {a.entry.openAtlas}
              </a>
            </div>
          </section>

          <section aria-labelledby="cite-h" className="glass p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 id="cite-h" className="text-[1.25rem]" style={{ color: 'var(--ink)' }}>
              {a.entry.cite}
            </h2>
            <p className="mt-1 mb-3 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
              {a.entry.citeHint}
            </p>
            <p className="m-0 rounded-[10px] border p-3 text-[0.875rem] leading-relaxed select-all [overflow-wrap:anywhere]" style={{ borderColor: 'var(--line)', background: 'var(--surface-sunk)', color: 'var(--ink)' }}>
              {cite}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => copyCite(cite)} className="btn-quiet h-10 min-h-10 text-[0.875rem]" aria-live="polite">
                {citeSt === 'done' ? <Check size={16} /> : <Copy size={16} />}
                {citeSt === 'done' ? a.entry.copied : citeSt === 'fail' ? a.entry.copyFail : a.entry.copy}
              </button>
              {shareBtn}
            </div>
          </section>

          <section aria-labelledby="sug-h" className="glass p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 id="sug-h" className="text-[1.25rem]" style={{ color: 'var(--ink)' }}>
              {a.entry.suggest}
            </h2>
            <p className="mt-1 mb-3 text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
              {a.entry.suggestHint}
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={suggestMailto(subject, body)} className="btn-primary h-10 min-h-10 px-4 text-[0.875rem]">
                <Send size={16} />
                {a.entry.suggest}
              </a>
              <button type="button" onClick={() => copySuggest(`${subject}\n\n${body}`)} className="btn-quiet h-10 min-h-10 text-[0.875rem]" aria-live="polite">
                {suggestSt === 'done' ? <Check size={16} /> : <Copy size={16} />}
                {suggestSt === 'done' ? a.entry.copied : a.entry.copyText}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </article>
  )
}
