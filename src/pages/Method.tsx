import { Download, Map as MapIcon } from 'lucide-react'
import { useI18n } from '../i18n'
import { useArc } from '../i18n/arc'
import { ARCHIVE, ARC_META } from '../lib/archive'
import { href } from '../lib/router'
import { Footer } from '../components/Footer'

export default function Method() {
  const a = useArc()
  const { lang } = useI18n()
  return (
    <>
      <article className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6 lg:pt-16">
        <a href={href({ page: 'archive' })} className="text-[0.9375rem] no-underline hover:underline" style={{ color: 'var(--link)' }}>
          ← {a.entry.back}
        </a>
        <h1 className="mt-4 text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
          {a.method.title}
        </h1>
        <p className="mt-4 mb-0 max-w-[44rem] text-[1.125rem]" style={{ color: 'var(--ink-soft)' }}>
          {a.method.lede}
        </p>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {a.method.blocks.map((b, i) => (
            <section key={b.h} aria-labelledby={`m-${i}`}>
              <h2 id={`m-${i}`} className="text-[1.5rem]" style={{ color: 'var(--ink)' }}>
                {b.h}
              </h2>
              <p className="mt-3 mb-0 max-w-[60ch] text-[1rem] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                {b.p}
              </p>
            </section>
          ))}
        </div>
        <div className="glass mt-14 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
            <div>
              {a.method.updated}: <span className="tabular font-medium" style={{ color: 'var(--ink)' }}>{ARC_META.retrieved}</span> · {a.results(ARCHIVE.length)}
            </div>
            <div className="mt-1 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
              {lang === 'az' ? ARC_META.licence.az : ARC_META.licence.en}
            </div>
            <code className="mt-2 block text-[0.75rem]" style={{ color: 'var(--ink-faint)' }}>
              {a.method.rebuild}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/data/toponim-arxiv.json" download className="btn-quiet h-10 min-h-10 text-[0.875rem]">
              <Download size={16} /> JSON
            </a>
            <a href="/data/toponim-arxiv.csv" download className="btn-quiet h-10 min-h-10 text-[0.875rem]">
              <Download size={16} /> CSV
            </a>
            <a href={href({ page: 'atlas' })} className="btn-primary h-10 min-h-10 px-4 text-[0.875rem]">
              <MapIcon size={16} /> {a.openMap}
            </a>
          </div>
        </div>
      </article>
      <Footer />
    </>
  )
}
