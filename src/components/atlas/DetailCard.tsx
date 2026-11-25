import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileText, MapPin, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { Lang, Toponym } from '../../lib/data'
import { href } from '../../lib/router'
import { PinMark } from '../PinMark'
import { SampleBadge } from '../Shell'

const LANG_LABEL: Record<Lang, string> = { az: 'AZ', ru: 'RU', en: 'EN' }

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="badge-gold">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7.5" fill="#3A2600" />
        <path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#F2B84B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  )
}

export function Timeline({ t }: { t: Toponym }) {
  const { t: s } = useI18n()
  const forms = [...t.historicalForms].sort((a, b) => a.year - b.year)
  return (
    <ol className="relative flex gap-0 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
      {forms.map((f, i) => {
        const last = i === forms.length - 1
        return (
          <li key={f.source} className="relative min-w-[6.75rem] flex-1 pr-3 sm:min-w-[8.5rem]">
            {/* connector */}
            {!last && (
              <span
                aria-hidden
                className="absolute top-[34px] left-[10px] h-[2px]"
                style={{
                  right: '-10px',
                  background: `linear-gradient(90deg, ${mix(i / (forms.length - 1))}, ${mix((i + 1) / (forms.length - 1))})`,
                }}
              />
            )}
            <span className="tabular block text-[0.8125rem] font-semibold" style={{ color: last ? 'var(--gold-ink-on)' : 'var(--ink-soft)' }}>
              {f.year}
            </span>
            <span
              aria-hidden
              className="relative z-[1] mt-2 block h-[14px] w-[14px] rounded-full"
              style={{
                left: '3px',
                background: last ? '#F2B84B' : 'var(--page)',
                border: `2px solid ${last ? '#F2B84B' : mix(i / Math.max(1, forms.length - 1))}`,
                boxShadow: last ? '0 0 0 4px rgba(242,184,75,0.22)' : 'none',
              }}
            />
            <span className="mt-3 block font-[family-name:var(--font-display)] text-[1.0625rem] leading-snug italic" style={{ color: 'var(--ink)' }}>
              {f.form}
            </span>
            <span className="mt-1 block text-[0.75rem] leading-snug" style={{ color: 'var(--ink-faint)' }}>
              {s.kinds[f.kind]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** violet-500 → gold along the timeline */
function mix(p: number) {
  const a = [139, 92, 246]
  const b = [242, 184, 75]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * p))
  return `rgb(${c.join(',')})`
}

export function DetailCard({ t, onClose }: { t: Toponym; onClose: () => void }) {
  const { t: s, lang } = useI18n()
  const [copy, setCopy] = useState<'idle' | 'done' | 'fail'>('idle')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setCopy('idle')
    titleRef.current?.focus({ preventScroll: true })
  }, [t.id])

  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])

  const share = async () => {
    const url = `${location.origin}${location.pathname}${href({ page: 'atlas', id: t.id })}`
    try {
      await navigator.clipboard.writeText(url)
      setCopy('done')
    } catch {
      setCopy('fail')
    }
    window.setTimeout(() => setCopy('idle'), 2200)
  }

  const others = (['az', 'ru', 'en'] as Lang[]).filter((l) => l !== lang)

  return (
    <article aria-labelledby="detail-title" className="flex h-full flex-col">
      <header className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip">{s.types[t.type]}</span>
            {t.status === 'verified' ? (
              <VerifiedBadge label={s.detail.verified} />
            ) : (
              <span className="chip" style={{ background: 'transparent', border: '1px dashed var(--line-strong)', color: 'var(--ink-soft)' }}>
                {s.detail.pending}
              </span>
            )}
          </div>
          <h2 id="detail-title" ref={titleRef} tabIndex={-1} className="outline-none text-[2rem] leading-[1.1] sm:text-[2.375rem]" style={{ color: 'var(--ink)' }}>
            {t.names[lang]}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={s.detail.close}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] transition-colors duration-200 hover:bg-[var(--chip)]"
          style={{ color: 'var(--ink-soft)' }}
        >
          <X size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
        {/* names in three languages */}
        <section aria-label={s.detail.names} className="mt-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            {others.map((l) => (
              <div key={l} className="min-w-0">
                <dt className="text-[0.75rem] font-medium" style={{ color: 'var(--ink-faint)' }}>
                  {LANG_LABEL[l]}
                </dt>
                <dd className="m-0 truncate text-[1.0625rem] font-medium" style={{ color: 'var(--ink-soft)' }} lang={l}>
                  {t.names[l]}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-7" aria-labelledby="tl-h">
          <h3 id="tl-h" className="mb-3 font-[family-name:var(--font-sans)] text-[0.8125rem] font-semibold tracking-normal" style={{ color: 'var(--ink-soft)' }}>
            {s.detail.timeline}
          </h3>
          <Timeline t={t} />
        </section>

        <section className="mt-6" aria-labelledby="mn-h">
          <h3 id="mn-h" className="mb-2 font-[family-name:var(--font-sans)] text-[0.8125rem] font-semibold tracking-normal" style={{ color: 'var(--ink-soft)' }}>
            {s.detail.meaning}
          </h3>
          <p className="m-0 text-[1rem]" style={{ color: 'var(--ink)' }}>
            {t.meaning[lang]}
          </p>
          <p className="mt-1 mb-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
            {s.detail.meaningNote}
          </p>
        </section>

        <section className="mt-6" aria-labelledby="src-h">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 id="src-h" className="font-[family-name:var(--font-sans)] text-[0.8125rem] font-semibold tracking-normal" style={{ color: 'var(--ink-soft)' }}>
              {s.detail.sources}
            </h3>
            <SampleBadge compact />
          </div>
          <ul className="m-0 flex list-none flex-col divide-y p-0" style={{ borderColor: 'var(--line)' }}>
            {t.sources.map((src) => (
              <li key={src.code} className="flex items-center gap-3 py-2" style={{ borderColor: 'var(--line)' }}>
                <FileText size={16} aria-hidden style={{ color: 'var(--link)' }} className="shrink-0" />
                <span className="min-w-0 flex-1 text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
                  {s.kinds[src.kind]}
                  <span className="tabular ml-2 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                    {src.code}
                  </span>
                </span>
                <span className="tabular text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
                  {src.year}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 text-[0.875rem]">
          <div>
            <div style={{ color: 'var(--ink-faint)' }}>{s.detail.confidence}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--chip)' }}>
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${t.confidence * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#8B5CF6)' }} />
              </span>
              <span className="tabular font-semibold" style={{ color: 'var(--ink)' }}>
                {Math.round(t.confidence * 100)}%
              </span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-faint)' }}>{s.detail.region}</div>
            <div className="mt-1 font-medium" style={{ color: 'var(--ink)' }}>
              {s.regions[t.region as keyof typeof s.regions]}
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2" style={{ color: 'var(--ink-soft)' }}>
            <MapPin size={15} aria-hidden />
            <span className="sr-only">{s.detail.coords}: </span>
            <span className="tabular">
              {t.coordinates[1].toFixed(2)}° N, {t.coordinates[0].toFixed(2)}° E
            </span>
            {t.verifiedBy && <span className="ml-auto text-[0.8125rem]">{s.detail.verifiedBy(t.verifiedBy)}</span>}
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-3 border-t px-5 py-4 sm:px-6" style={{ borderColor: 'var(--line)' }}>
        <PinMark size={22} tone={t.status === 'verified' ? 'gold' : 'muted'} />
        <span className="tabular min-w-0 flex-1 truncate text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          #/atlas/{t.id}
        </span>
        <button type="button" onClick={share} className="btn-quiet h-10 min-h-10 text-[0.875rem]" aria-live="polite">
          {copy === 'done' ? <Check size={16} /> : <Copy size={16} />}
          {copy === 'done' ? s.detail.copied : copy === 'fail' ? s.detail.copyFailed : s.detail.share}
        </button>
      </footer>
    </article>
  )
}
