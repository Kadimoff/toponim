import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Info, Menu, Moon, Sun, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { href, type Route } from '../lib/router'
import { useTheme } from '../lib/theme'
import type { Lang } from '../lib/data'
import { PinMark } from './PinMark'

const PAGES = ['home', 'atlas', 'archive', 'ai', 'stats', 'about'] as const

export function SampleBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-[0.75rem] font-medium whitespace-nowrap"
      style={{ borderColor: 'var(--line-strong)', color: 'var(--ink-soft)' }}
      title={t.sampleLong}
    >
      <Info size={13} aria-hidden />
      {compact ? t.sample : t.sample}
      <span className="sr-only">. {t.sampleLong}</span>
    </span>
  )
}

function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  const langs: Lang[] = ['az', 'ru', 'en']
  return (
    <div role="group" aria-label={t.lang} className="flex rounded-[10px] border p-0.5" style={{ borderColor: 'var(--line)' }}>
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className="relative h-9 min-w-10 rounded-[10px] px-2 text-[0.8125rem] font-medium uppercase transition-colors duration-200"
          style={{ color: lang === l ? 'var(--ink)' : 'var(--ink-faint)' }}
        >
          {lang === l && (
            <m.span
              layoutId="lang-pill"
              className="absolute inset-0 rounded-[10px]"
              style={{ background: 'var(--chip)', boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.theme.toggle}
      title={theme === 'dark' ? t.theme.light : t.theme.dark}
      className="grid h-10 w-10 place-items-center rounded-[10px] border transition-colors duration-200 hover:bg-[var(--chip)]"
      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </m.span>
      </AnimatePresence>
    </button>
  )
}

export function Shell({ route, children, fullBleed }: { route: Route; children: ReactNode; fullBleed?: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [route])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const solid = scrolled || fullBleed || open

  return (
    <div className={fullBleed ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-dvh'}>
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-[var(--surface-solid)] focus:px-4 focus:py-2"
      >
        {t.skip}
      </a>
      <header
        className="sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300"
        style={{
          background: solid ? 'var(--glass-strong)' : 'transparent',
          backdropFilter: solid ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: solid ? 'blur(14px)' : 'none',
          borderBottom: `1px solid ${solid ? 'var(--line)' : 'transparent'}`,
        }}
      >
        <div className={`mx-auto flex h-16 items-center gap-4 px-4 sm:px-6 ${fullBleed ? 'max-w-none' : 'max-w-[1320px]'}`}>
          <a href={href({ page: 'home' })} className="flex min-w-0 items-center gap-3 no-underline" style={{ color: 'var(--ink)' }}>
            <PinMark size={30} />
            <span className="truncate font-[family-name:var(--font-display)] text-[1.125rem] font-medium">
              {t.brand}
            </span>
          </a>

          <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
            {PAGES.map((p) => {
              const active = route.page === p || (p === 'archive' && route.page === 'method')
              return (
                <a
                  key={p}
                  href={href({ page: p } as Route)}
                  aria-current={active ? 'page' : undefined}
                  className="relative rounded-lg px-3 py-2 text-[0.9375rem] font-medium no-underline transition-colors duration-200 hover:text-[var(--ink)]"
                  style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)' }}
                >
                  {t.nav[p]}
                  {active && (
                    <m.span
                      layoutId="nav-underline"
                      className="absolute right-3 -bottom-[1px] left-3 h-[2px] rounded-full"
                      style={{ background: '#8B5CF6' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            {route.page === 'ai' && (
              <span className="hidden xl:inline-flex">
                <SampleBadge />
              </span>
            )}
            <span className="hidden sm:block">
              <LangSwitch />
            </span>
            <ThemeToggle />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-[10px] border lg:hidden"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={t.menu}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <m.nav
              id="mobile-nav"
              aria-label="Primary"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t lg:hidden"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex flex-col gap-1 px-4 pt-3 pb-5">
                {PAGES.map((p) => (
                  <a
                    key={p}
                    href={href({ page: p } as Route)}
                    aria-current={route.page === p ? 'page' : undefined}
                    className="rounded-[10px] px-3 py-3 text-[1.0625rem] font-medium no-underline"
                    style={{
                      color: 'var(--ink)',
                      background: route.page === p ? 'var(--chip)' : 'transparent',
                    }}
                  >
                    {t.nav[p]}
                  </a>
                ))}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <LangSwitch />
                  {route.page === 'ai' && <SampleBadge />}
                </div>
              </div>
            </m.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="main" tabIndex={-1} className={fullBleed ? 'relative min-h-0 flex-1 outline-none' : 'outline-none'}>
        {children}
      </main>
    </div>
  )
}
