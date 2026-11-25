import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { ArrowRight, Check, FileText, FlaskConical, ScanText, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { extract, type Hit } from '../lib/extract'
import { href } from '../lib/router'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { PinMark } from '../components/PinMark'
import { VerifiedBadge } from '../components/atlas/DetailCard'
import { Footer } from '../components/Footer'

type Phase = 'edit' | 'scanning' | 'done'
type Decision = 'review' | 'approved' | 'rejected'
const ease = [0.22, 1, 0.36, 1] as const

function Stepper({ stage }: { stage: number }) {
  const { t } = useI18n()
  return (
    <ol className="m-0 flex list-none items-center gap-2 p-0" aria-label={t.ai.flow.join(' → ')}>
      {t.ai.flow.map((label, i) => {
        const done = i < stage
        const active = i === stage
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-4 sm:w-8" style={{ background: done || active ? '#8B5CF6' : 'var(--line)' }} />}
            <span
              aria-current={active ? 'step' : undefined}
              className="flex items-center gap-2 text-[0.8125rem] font-medium whitespace-nowrap"
              style={{ color: active ? 'var(--ink)' : done ? 'var(--ink-soft)' : 'var(--ink-faint)' }}
            >
              <span
                className="grid h-5 w-5 place-items-center rounded-full border text-[0.6875rem]"
                style={{
                  borderColor: i === 2 && (active || done) ? '#F2B84B' : done || active ? '#8B5CF6' : 'var(--line-strong)',
                  background: i === 2 && active ? '#F2B84B' : done ? '#8B5CF6' : 'transparent',
                  color: i === 2 && active ? '#3A2600' : done ? '#fff' : 'inherit',
                }}
              >
                {done || (i === 2 && active) ? <Check size={12} strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={active ? '' : 'hidden sm:inline'}>{label}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Highlighted({ text, hits, reveal }: { text: string; hits: Hit[]; reveal: boolean }) {
  const parts: React.ReactNode[] = []
  let at = 0
  hits.forEach((h, i) => {
    if (h.start > at) parts.push(text.slice(at, h.start))
    parts.push(
      <m.mark
        key={i}
        initial={reveal ? { backgroundColor: 'rgba(139,92,246,0)' } : false}
        animate={{ backgroundColor: 'rgba(139,92,246,0.26)' }}
        transition={{ duration: 0.3, delay: reveal ? 0.05 * i : 0, ease }}
        className="rounded-[4px] px-1 py-0.5"
        style={{ color: 'var(--ink)', boxShadow: 'inset 0 -2px 0 #8B5CF6' }}
      >
        {h.text}
        <sup className="tabular ml-1 font-[family-name:var(--font-sans)] text-[0.6875rem] font-semibold" style={{ color: 'var(--link)' }}>
          {Math.round(h.confidence * 100)}%
        </sup>
      </m.mark>,
    )
    at = h.end
  })
  parts.push(text.slice(at))
  return <>{parts}</>
}

export default function AiDemo() {
  const { t, lang } = useI18n()
  const reduce = useReducedMotion()
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('edit')
  const [hits, setHits] = useState<Hit[]>([])
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const docRef = useRef<HTMLDivElement>(null)
  const [docH, setDocH] = useState(240)

  // reset sample text when the interface language changes and the user hasn't typed their own
  const lastSample = useRef('')
  useEffect(() => {
    if (text === lastSample.current && text) {
      setText(t.ai.sampleText)
      lastSample.current = t.ai.sampleText
      setPhase('edit')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const unique = useMemo(() => {
    const m = new Map<string, Hit>()
    hits.forEach((h) => {
      const prev = m.get(h.toponym.id)
      if (!prev || h.confidence > prev.confidence) m.set(h.toponym.id, h)
    })
    return [...m.values()]
  }, [hits])

  const run = () => {
    if (!text.trim()) {
      setError(t.ai.emptyInput)
      return
    }
    setError('')
    setOpen(null)
    setDecisions({})
    const found = extract(text)
    setHits(found)
    setPhase('scanning')
    requestAnimationFrame(() => setDocH(docRef.current?.offsetHeight ?? 240))
    window.setTimeout(() => setPhase('done'), reduce ? 50 : 1500)
  }

  const decide = (id: string, d: Decision) => setDecisions((s) => ({ ...s, [id]: d }))
  const stageOf = (id: string) => {
    const d = decisions[id]
    if (d === 'approved') return 2
    if (d === 'review' || open === id) return 1
    return 0
  }

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6 lg:pt-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
              {t.ai.title}
            </h1>
            <p className="mt-4 mb-0 max-w-[40rem] text-[1.125rem]" style={{ color: 'var(--ink-soft)' }}>
              {t.ai.lede}
            </p>
          </div>
          <p
            className="m-0 inline-flex items-center gap-2 self-start rounded-[8px] border border-dashed px-3 py-2 text-[0.8125rem] lg:self-auto"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--ink-soft)' }}
          >
            <FlaskConical size={16} aria-hidden />
            {t.ai.simulation}
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* ---------------- document ---------------- */}
          <div className="glass flex flex-col p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="archive-text" className="text-[0.875rem] font-medium" style={{ color: 'var(--ink-soft)' }}>
                {t.ai.inputLabel}
              </label>
              <div className="flex gap-2">
                {phase !== 'edit' ? (
                  <button type="button" className="btn-quiet h-9 min-h-9 px-3 text-[0.8125rem]" onClick={() => setPhase('edit')}>
                    {t.ai.back}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-quiet h-9 min-h-9 px-3 text-[0.8125rem]"
                      onClick={() => {
                        setText(t.ai.sampleText)
                        lastSample.current = t.ai.sampleText
                        setError('')
                      }}
                    >
                      <FileText size={16} />
                      {t.ai.sampleBtn}
                    </button>
                    {text && (
                      <button type="button" className="btn-quiet h-9 min-h-9 px-3 text-[0.8125rem]" onClick={() => setText('')}>
                        {t.ai.clear}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-[12px] border" style={{ borderColor: 'var(--line)', background: 'var(--surface-sunk)' }}>
              {phase === 'edit' ? (
                <textarea
                  id="archive-text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    if (error) setError('')
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'ai-error' : undefined}
                  rows={9}
                  className="block h-full min-h-[240px] w-full resize-y bg-transparent p-4 font-[family-name:var(--font-display)] text-[1.125rem] leading-[1.75] outline-none placeholder:text-[var(--ink-faint)]"
                  style={{ color: 'var(--ink)' }}
                  placeholder={t.ai.sampleText.slice(0, 80) + '…'}
                />
              ) : (
                <div ref={docRef} className="relative p-4 font-[family-name:var(--font-display)] text-[1.125rem] leading-[1.75]" style={{ color: 'var(--ink-soft)' }} aria-live="polite">
                  {phase === 'done' ? <Highlighted text={text} hits={hits} reveal={!reduce} /> : text}
                  {phase === 'scanning' && !reduce && (
                    <m.div
                      className="scan-beam"
                      initial={{ y: -70 }}
                      animate={{ y: docH }}
                      transition={{ duration: 1.4, ease: [0.45, 0, 0.55, 1] }}
                      aria-hidden
                    />
                  )}
                </div>
              )}
            </div>

            {error && (
              <p id="ai-error" role="alert" className="mt-3 mb-0 text-[0.875rem]" style={{ color: 'var(--link)' }}>
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[0.875rem]" style={{ color: 'var(--ink-faint)' }} aria-live="polite">
                {phase === 'scanning' ? t.ai.scanning : phase === 'done' ? (unique.length ? t.ai.found(unique.length) : '') : ''}
              </span>
              <button type="button" className="btn-primary" onClick={run} disabled={phase === 'scanning'}>
                <ScanText size={18} />
                {t.ai.run}
              </button>
            </div>
          </div>

          {/* ---------------- results ---------------- */}
          <div className="glass flex min-h-[320px] flex-col p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="font-[family-name:var(--font-sans)] text-[0.875rem] font-medium tracking-normal" style={{ color: 'var(--ink-soft)' }}>
              {t.ai.resultTitle}
            </h2>

            {phase === 'scanning' && (
              <div className="mt-4 flex flex-col gap-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-16" />
                ))}
              </div>
            )}

            {phase === 'edit' && (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <PinMark size={44} tone="muted" />
                <p className="mt-4 mb-0 max-w-[30ch] text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
                  {t.ai.lede}
                </p>
              </div>
            )}

            {phase === 'done' && unique.length === 0 && (
              <p className="mt-6 text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
                {t.ai.none}
              </p>
            )}

            {phase === 'done' && unique.length > 0 && (
              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                {unique.map((h, i) => {
                  const id = h.toponym.id
                  const d = decisions[id]
                  const isOpen = open === id
                  return (
                    <m.li
                      key={id}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: reduce ? 0 : 0.05 * Math.min(i, 6), ease }}
                      className="rounded-[12px] border"
                      style={{ borderColor: isOpen ? '#8B5CF6' : 'var(--line)', background: 'var(--surface-sunk)' }}
                    >
                      <div className="flex items-center gap-3 px-3 py-3">
                        <PinMark size={28} tone={d === 'approved' ? 'gold' : d === 'rejected' ? 'muted' : 'violet'} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[1rem] font-medium" style={{ color: 'var(--ink)', textDecoration: d === 'rejected' ? 'line-through' : undefined }}>
                            {h.toponym.names[lang]}
                          </div>
                          <div className="truncate text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                            «{h.text}»{h.viaHistorical && <> · {t.ai.matchedForm}</>} · {t.types[h.toponym.type]}
                          </div>
                        </div>
                        <span className="tabular text-[0.875rem] font-medium" style={{ color: 'var(--ink-soft)' }}>
                          {Math.round(h.confidence * 100)}%
                        </span>
                      </div>

                      {!d && !isOpen && (
                        <div className="px-3 pb-3">
                          <button
                            type="button"
                            className="btn-quiet h-9 min-h-9 w-full text-[0.875rem]"
                            onClick={() => {
                              setOpen(id)
                              decide(id, 'review')
                            }}
                          >
                            {t.ai.addToAtlas}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {(isOpen || d === 'approved' || d === 'rejected') && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease }}
                            className="overflow-hidden"
                          >
                            <div className="border-t px-3 pt-3 pb-3" style={{ borderColor: 'var(--line)' }}>
                              <div className="mb-3">
                                <Stepper stage={stageOf(id)} />
                              </div>
                              {d === 'approved' ? (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <VerifiedBadge label={t.ai.approved} />
                                  <a href={href({ page: 'atlas', id })} className="inline-flex items-center gap-1 text-[0.875rem] font-medium">
                                    {t.ai.openInAtlas}
                                    <ArrowRight size={16} />
                                  </a>
                                </div>
                              ) : d === 'rejected' ? (
                                <p className="m-0 text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
                                  {t.ai.rejected}
                                </p>
                              ) : (
                                <>
                                  <p className="m-0 text-[0.875rem] font-medium" style={{ color: 'var(--ink)' }}>
                                    {t.ai.expertTitle}
                                  </p>
                                  <p className="mt-1 mb-3 text-[0.8125rem]" style={{ color: 'var(--ink-soft)' }}>
                                    {t.ai.expertText}
                                  </p>
                                  <dl className="m-0 mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.8125rem]">
                                    <dt style={{ color: 'var(--ink-faint)' }}>{t.ai.inputLabel}</dt>
                                    <dd className="m-0 font-[family-name:var(--font-display)] italic" style={{ color: 'var(--ink)' }}>
                                      {h.text}
                                    </dd>
                                    <dt style={{ color: 'var(--ink-faint)' }}>{t.detail.sources}</dt>
                                    <dd className="tabular m-0" style={{ color: 'var(--ink-soft)' }}>
                                      {h.toponym.sources[0].code} · {t.kinds[h.toponym.sources[0].kind]}, {h.toponym.sources[0].year}
                                    </dd>
                                  </dl>
                                  <div className="flex gap-2">
                                    <button type="button" className="btn-primary h-10 min-h-10 flex-1 text-[0.875rem]" onClick={() => decide(id, 'approved')}>
                                      <Check size={16} />
                                      {t.ai.approve}
                                    </button>
                                    <button type="button" className="btn-quiet h-10 min-h-10 text-[0.875rem]" onClick={() => decide(id, 'rejected')}>
                                      <X size={16} />
                                      {t.ai.reject}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
