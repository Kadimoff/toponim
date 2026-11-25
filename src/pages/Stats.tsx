import { useMemo, useRef } from 'react'
import { m, useInView } from 'framer-motion'
import { useI18n } from '../i18n'
import { PERIODS, TOPONYMS, TYPES } from '../lib/data'
import { CountUp } from '../components/CountUp'
import { SampleBadge } from '../components/Shell'
import { Footer } from '../components/Footer'
import { useReducedMotion } from '../hooks/useReducedMotion'

const ease = [0.22, 1, 0.36, 1] as const

export default function Stats() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const chartRef = useRef<HTMLDivElement>(null)
  const inView = useInView(chartRef, { once: true, margin: '-10% 0px' })
  const grow = inView || reduce

  const data = useMemo(() => {
    const total = TOPONYMS.length
    const forms = TOPONYMS.reduce((a, x) => a + x.historicalForms.length, 0)
    const sources = TOPONYMS.reduce((a, x) => a + x.sources.length, 0)
    const avg = Math.round((TOPONYMS.reduce((a, x) => a + x.confidence, 0) / total) * 100)
    const verified = TOPONYMS.filter((x) => x.status === 'verified').length
    const byPeriod = PERIODS.map((p) => {
      const items = TOPONYMS.filter((x) => x.period === p)
      return { p, verified: items.filter((x) => x.status === 'verified').length, pending: items.filter((x) => x.status === 'pending').length }
    })
    const byType = TYPES.map((ty) => ({ ty, n: TOPONYMS.filter((x) => x.type === ty).length })).sort((a, b) => b.n - a.n)
    return { total, forms, sources, avg, verified, byPeriod, byType }
  }, [])

  const maxPeriod = Math.max(...data.byPeriod.map((d) => d.verified + d.pending))
  const yMax = Math.ceil(maxPeriod / 4) * 4
  const ticks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax]
  const pct = Math.round((data.verified / data.total) * 100)

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6 lg:pt-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
              {t.stats.title}
            </h1>
            <p className="mt-4 mb-0 max-w-[40rem] text-[1.125rem]" style={{ color: 'var(--ink-soft)' }}>
              {t.stats.lede}
            </p>
          </div>
          <SampleBadge />
        </div>

        {/* compact figures */}
        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border lg:grid-cols-4" style={{ borderColor: 'var(--line)', background: 'var(--line)' }}>
          {[
            { n: data.total, l: t.stats.total },
            { n: data.forms, l: t.stats.forms },
            { n: data.sources, l: t.stats.sources },
            { n: data.avg, l: t.stats.avgConf, suffix: '%' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse gap-1 p-5 sm:p-6" style={{ background: 'var(--page)' }}>
              <dt className="text-[0.875rem]" style={{ color: 'var(--ink-soft)' }}>
                {s.l}
              </dt>
              <dd className="m-0 font-[family-name:var(--font-display)] text-[2.5rem] leading-none tracking-[-0.02em] sm:text-[3rem]" style={{ color: 'var(--ink)' }}>
                <CountUp to={s.n} />
                {s.suffix}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* main chart: by period, verified vs pending */}
          <figure className="glass m-0 p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[1.375rem]" style={{ color: 'var(--ink)' }}>
                {t.stats.byPeriod}
              </h2>
              <span className="flex items-center gap-4 text-[0.8125rem]" style={{ color: 'var(--ink-soft)' }}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: '#8B5CF6' }} aria-hidden />
                  {t.status.verified}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--chip)', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }} aria-hidden />
                  {t.status.pending}
                </span>
              </span>
            </figcaption>

            <div ref={chartRef} className="relative mt-8 h-[300px]" role="img" aria-label={data.byPeriod.map((d) => `${t.periods[d.p]}: ${d.verified} / ${d.pending}`).join('; ')}>
              {/* grid */}
              <div className="absolute inset-0 bottom-8 left-8">
                {ticks.map((v) => (
                  <div key={v} className="absolute right-0 left-0 border-t" style={{ bottom: `${(v / yMax) * 100}%`, borderColor: 'var(--line)' }}>
                    <span className="tabular absolute -top-2 -left-8 w-6 text-right text-[0.75rem]" style={{ color: 'var(--ink-faint)' }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              {/* bars */}
              <div className="absolute inset-0 bottom-8 left-8 flex items-end justify-around gap-4 px-2 sm:gap-8 sm:px-6">
                {data.byPeriod.map((d, i) => {
                  const total = d.verified + d.pending
                  return (
                    <div key={d.p} className="relative flex h-full max-w-[88px] flex-1 flex-col justify-end">
                      <span className="tabular mb-2 text-center text-[0.875rem] font-medium" style={{ color: 'var(--ink)' }}>
                        {total}
                      </span>
                      <m.div
                        className="flex w-full flex-col overflow-hidden rounded-t-[6px]"
                        style={{ height: `${(total / yMax) * 100}%`, originY: 1 }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: grow ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: 0.06 * i, ease }}
                      >
                        <div style={{ flex: d.pending, background: 'var(--chip)', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }} />
                        <div style={{ flex: d.verified, background: 'linear-gradient(180deg,#8B5CF6,#6D28D9)' }} />
                      </m.div>
                    </div>
                  )
                })}
              </div>
              {/* x labels */}
              <div className="absolute right-0 bottom-0 left-8 flex justify-around gap-4 px-2 sm:gap-8 sm:px-6">
                {data.byPeriod.map((d) => (
                  <span key={d.p} className="max-w-[88px] flex-1 text-center text-[0.8125rem]" style={{ color: 'var(--ink-soft)' }}>
                    {t.periods[d.p]}
                  </span>
                ))}
              </div>
            </div>
          </figure>

          <div className="flex flex-col gap-6">
            {/* verification progress: the one gold figure */}
            <section className="glass p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="prog-h">
              <h2 id="prog-h" className="font-[family-name:var(--font-sans)] text-[0.875rem] font-medium tracking-normal" style={{ color: 'var(--ink-soft)' }}>
                {t.stats.progress}
              </h2>
              <p className="mt-3 mb-0 font-[family-name:var(--font-display)] text-[3.5rem] leading-none tracking-[-0.03em]" style={{ color: 'var(--gold-figure)' }}>
                <CountUp to={pct} />%
              </p>
              <div
                className="relative mt-5 h-2 overflow-hidden rounded-full"
                style={{ background: 'var(--chip)' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={data.total}
                aria-valuenow={data.verified}
                aria-label={t.stats.progress}
              >
                <m.span
                  className="absolute inset-y-0 left-0 w-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#8B5CF6,#F2B84B)', originX: 0 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: grow ? data.verified / data.total : 0 }}
                  transition={{ duration: 0.7, ease }}
                />
              </div>
              <p className="mt-3 mb-0 text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
                {t.stats.verifiedOf(data.verified, data.total)}
              </p>
              <p className="mt-1 mb-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                {t.stats.pendingNote(data.total - data.verified)}
              </p>
            </section>

            {/* by type: ranked list with thin bars */}
            <section className="glass p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="type-h">
              <h2 id="type-h" className="font-[family-name:var(--font-sans)] text-[0.875rem] font-medium tracking-normal" style={{ color: 'var(--ink-soft)' }}>
                {t.stats.byType}
              </h2>
              <ul className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
                {data.byType.map((d, i) => (
                  <li key={d.ty}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
                        {t.typesPlural[d.ty]}
                        <span className="ml-2 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                          {t.typeHint[d.ty]}
                        </span>
                      </span>
                      <span className="tabular text-[0.9375rem] font-medium" style={{ color: 'var(--ink)' }}>
                        {d.n}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'var(--chip)' }}>
                      <m.div
                        className="h-full w-full rounded-full"
                        style={{ background: i === 0 ? '#8B5CF6' : 'var(--line-strong)', originX: 0 }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: grow ? d.n / data.total : 0 }}
                        transition={{ duration: 0.5, delay: 0.06 * i, ease }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
