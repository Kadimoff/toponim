import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '../../i18n'
import { BY_ID, TOPONYMS, type Toponym } from '../../lib/data'
import { href } from '../../lib/router'
import { useThemeValue } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { PinMark } from '../PinMark'
import PINS from '../../data/hero-pins.json'

const CYCLE = ['gumusdere', 'yeddiqapi', 'qartaldas', 'soyuqsu']
type PinSet = Record<string, [number, number]>
const WIDE = (PINS as unknown as { wide: PinSet }).wide
const TALL = (PINS as unknown as { tall: PinSet }).tall

function Pins({ pos, selected, reduce, size = 22 }: { pos: PinSet; selected?: string; reduce: boolean; size?: number }) {
  return (
    <>
      {TOPONYMS.map((tp, k) => {
        const p = pos[tp.id]
        if (!p) return null
        const sel = tp.id === selected
        return (
          <a
            key={tp.id}
            href={href({ page: 'atlas', id: tp.id })}
            tabIndex={-1}
            aria-hidden
            className="pin absolute -translate-x-1/2 -translate-y-1/2"
            data-selected={sel}
            style={{
              left: `${p[0]}%`,
              top: `${p[1]}%`,
              width: size,
              height: size,
              animation: reduce ? undefined : `pinIn 320ms cubic-bezier(.22,1,.36,1) ${200 + k * 40}ms both`,
            }}
          >
            <PinMark size={size} tone={sel ? 'gold' : tp.status === 'pending' ? 'muted' : 'violet'} />
          </a>
        )
      })}
    </>
  )
}

function useHeroCycle() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const h = window.setTimeout(() => setReady(true), reduce ? 0 : 250 + TOPONYMS.length * 40)
    return () => window.clearTimeout(h)
  }, [reduce])
  useEffect(() => {
    if (!ready || reduce) return
    const h = window.setInterval(() => setI((n) => (n + 1) % CYCLE.length), 3600)
    return () => window.clearInterval(h)
  }, [ready, reduce])
  const current = BY_ID.get(CYCLE[i])!
  return { reduce, ready, current, selected: ready ? current.id : undefined }
}

function HistoryCard({ ready, current }: { ready: boolean; current: Toponym }) {
  const { lang } = useI18n()
  const forms = useMemo(() => [...current.historicalForms].sort((a, b) => a.year - b.year), [current])
  return (
    <AnimatePresence mode="wait">
      {ready && (
        <m.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass flex items-center gap-3 px-4 py-3"
          style={{ borderRadius: 14, background: 'var(--glass-strong)' }}
        >
          <PinMark size={30} tone="gold" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-[family-name:var(--font-display)] text-[1.125rem] leading-tight font-medium" style={{ color: 'var(--ink)' }}>
              {current.names[lang]}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem]" style={{ color: 'var(--ink-soft)' }}>
              {forms.map((f, k) => (
                <span key={f.source} className="inline-flex items-center gap-2 whitespace-nowrap">
                  {k > 0 && <ArrowRight size={12} aria-hidden style={{ color: 'var(--ink-faint)' }} />}
                  <span>{f.form}</span>
                  <span className="tabular" style={{ color: k === forms.length - 1 ? 'var(--gold-ink-on)' : 'var(--ink-faint)' }}>
                    {f.year}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

const Attribution = ({ bottom = 8 }: { bottom?: number }) => (
  <p style={{ bottom }} className="absolute right-2 m-0 rounded-[6px] px-2 py-0.5 text-[11px] [background:var(--glass-strong)] [color:var(--ink-faint)]">
    © OpenFreeMap © OpenMapTiles © OpenStreetMap
  </p>
)

/**
 * Full-bleed hero scene (tablet / desktop): the atlas basemap pre-rendered from the same OpenFreeMap style the
 * explorer uses (keeps ~1 MB of map engine off the landing page), live pins, one toponym's history at a time.
 * Azerbaijan sits on the right half; the left stays calm for the headline.
 */
export function HeroMapWide() {
  const { t } = useI18n()
  const theme = useThemeValue()
  const { reduce, ready, current, selected } = useHeroCycle()
  return (
    <div className="absolute inset-0 hidden lg:block" role="img" aria-label={t.home.previewLabel}>
      <div className="hero-stage-host absolute inset-0">
        <div className="hero-stage-wide">
          <img
            src={`/hero/wide-${theme}.webp`}
            srcSet={`/hero/wide-${theme}-1280.webp 1280w, /hero/wide-${theme}.webp 2400w`}
            sizes="max(100vw, 160vh)"
            width={2400}
            height={1500}
            alt=""
            decoding="async"
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
          <Pins pos={WIDE} selected={selected} reduce={reduce} />
        </div>
      </div>
      <div className="hero-scrim pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute right-8 bottom-12 w-[400px] xl:right-[max(2rem,calc((100vw-1320px)/2+1.5rem))]">
        <HistoryCard ready={ready} current={current} />
      </div>
      <Attribution />
    </div>
  )
}

/** Phones: the map window follows the text in reading order; its calm top slides under the actions. */
export function HeroMapTall() {
  const { t } = useI18n()
  const theme = useThemeValue()
  const { reduce, ready, current, selected } = useHeroCycle()
  return (
    <div className="md:ml-auto md:w-[560px] lg:hidden">
      <div className="relative -mt-28 aspect-[8/11] w-full overflow-hidden md:-mt-56 md:[mask-image:linear-gradient(90deg,transparent,#000_38%)]" role="img" aria-label={t.home.previewLabel}>
        <img src={`/hero/tall-${theme}.webp`} width={1200} height={1650} alt="" decoding="async" loading="lazy" className="absolute inset-0 h-full w-full" />
        <Pins pos={TALL} selected={selected} reduce={reduce} size={18} />
        <div className="hero-scrim-tall pointer-events-none absolute inset-0" aria-hidden />
        <Attribution bottom={36} />
      </div>
      <div className="relative -mt-6 min-h-[92px] px-4">
        <HistoryCard ready={ready} current={current} />
      </div>
    </div>
  )
}
