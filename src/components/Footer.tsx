import { useI18n } from '../i18n'
import { href, type Route } from '../lib/router'
import { PinMark } from './PinMark'

export function Footer() {
  const { t, lang } = useI18n()
  const pages = ['atlas', 'archive', 'ai', 'stats', 'about'] as const
  return (
    <footer className="border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <PinMark size={26} />
          <span className="font-[family-name:var(--font-display)] text-[1rem] font-semibold" style={{ color: 'var(--ink)' }}>
            {t.brand}
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {pages.map((p) => (
            <a key={p} href={href({ page: p } as Route)} className="text-[0.9375rem] no-underline hover:underline" style={{ color: 'var(--ink-soft)' }}>
              {t.nav[p]}
            </a>
          ))}
          <a href="#/metod" className="text-[0.9375rem] no-underline hover:underline" style={{ color: 'var(--ink-soft)' }}>
            {t.nav.archive} · {{ az: 'metodologiya', ru: 'методология', en: 'methodology' }[lang]}
          </a>
        </nav>
        <p className="m-0 text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          {t.footer}
        </p>
      </div>
    </footer>
  )
}
