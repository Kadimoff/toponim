import { useI18n } from '../../i18n'
import { useArc } from '../../i18n/arc'
import { ARCHIVE, ARC_PERIODS, ARC_TYPES, REGION_IDS } from '../../lib/archive'
import { href } from '../../lib/router'

function Bars({ rows, link }: { rows: { label: string; n: number; q: string }[]; link: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9.5rem)_1fr_2.5rem] items-center gap-3 text-[0.875rem]">
          {link ? (
            <a href={href({ page: 'archive', query: r.q })} className="truncate no-underline hover:underline" style={{ color: 'var(--ink-soft)' }}>
              {r.label}
            </a>
          ) : (
            <span className="truncate" style={{ color: 'var(--ink-soft)' }}>
              {r.label}
            </span>
          )}
          <span className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--chip)' }}>
            <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.n / max) * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)' }} />
          </span>
          <span className="tabular text-right font-semibold" style={{ color: 'var(--ink)' }}>
            {r.n}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ArchiveStats() {
  const a = useArc()
  useI18n()
  const n = ARCHIVE.length
  const pct = (k: number) => Math.round((k / n) * 100)
  const byType = ARC_TYPES.map((t) => ({ label: a.types[t], n: ARCHIVE.filter((x) => x.type === t).length, q: `?type=${t}` })).filter((r) => r.n)
  const byRegion = [...REGION_IDS.map((r) => ({ label: a.regions[r], n: ARCHIVE.filter((x) => x.region === r).length, q: `?region=${r}` })), { label: a.regionNone, n: ARCHIVE.filter((x) => !x.region).length, q: '?region=none' }]
    .filter((r) => r.n)
    .sort((x, y) => y.n - x.n)
  const byPeriod = [...ARC_PERIODS, 'unknown' as const].map((p) => ({ label: a.periods[p], n: ARCHIVE.filter((x) => (x.period ?? 'unknown') === p).length, q: `?period=${p}` }))
  const coverage = [
    { label: a.stats.cEtym, n: pct(ARCHIVE.filter((x) => x.hasEtymology).length) },
    { label: a.stats.cForms, n: pct(ARCHIVE.filter((x) => x.forms.length).length) },
    { label: a.stats.cWhen, n: pct(ARCHIVE.filter((x) => x.firstYear != null).length) },
    { label: a.stats.cRegion, n: pct(ARCHIVE.filter((x) => x.region).length) },
    { label: a.stats.cImage, n: pct(ARCHIVE.filter((x) => x.hasImage).length) },
  ]
  const card = 'glass m-0 p-5 sm:p-6'
  const h2 = 'mb-4 font-[family-name:var(--font-sans)] text-[0.875rem] font-medium tracking-normal'
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-16 sm:px-6 lg:pt-16">
      <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
        {a.stats.title}
      </h1>
      <p className="mt-4 mb-0 max-w-[44rem] text-[1.125rem]" style={{ color: 'var(--ink-soft)' }}>
        {a.lede(n)}
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className={card} style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="as-type">
          <h2 id="as-type" className={h2} style={{ color: 'var(--ink-soft)' }}>{a.stats.byType}</h2>
          <Bars rows={byType} link />
        </section>
        <section className={card} style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="as-period">
          <h2 id="as-period" className={h2} style={{ color: 'var(--ink-soft)' }}>{a.stats.byPeriod}</h2>
          <Bars rows={byPeriod} link />
        </section>
        <section className={card} style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="as-region">
          <h2 id="as-region" className={h2} style={{ color: 'var(--ink-soft)' }}>{a.stats.byRegion}</h2>
          <Bars rows={byRegion} link />
        </section>
        <section className={card} style={{ boxShadow: 'var(--shadow-card)' }} aria-labelledby="as-cov">
          <h2 id="as-cov" className={h2} style={{ color: 'var(--ink-soft)' }}>{a.stats.coverage}</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {coverage.map((c) => (
              <li key={c.label} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 text-[0.9375rem]">
                <span className="tabular font-[family-name:var(--font-display)] text-[1.5rem] leading-none" style={{ color: 'var(--ink)' }}>
                  {c.n}%
                </span>
                <span style={{ color: 'var(--ink-soft)' }}>{c.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 mb-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
            {a.honesty}
          </p>
        </section>
      </div>
    </section>
  )
}
