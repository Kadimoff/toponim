import { m } from 'framer-motion'
import { CountUp } from '../components/CountUp'
import { ArrowRight, Check, ScanText } from 'lucide-react'
import { useI18n } from '../i18n'
import { TOPONYMS } from '../lib/data'
import { href } from '../lib/router'
import { HeroMapTall, HeroMapWide } from '../components/home/MapPreview'
import { PinMark } from '../components/PinMark'
import { SampleBadge } from '../components/Shell'
import { Footer } from '../components/Footer'

const ease = [0.22, 1, 0.36, 1] as const

const N_TOPONYMS = TOPONYMS.length
const N_FORMS = TOPONYMS.reduce((a, t) => a + t.historicalForms.length, 0)
const N_VERIFIED = TOPONYMS.filter((t) => t.status === 'verified').length
const N_CENTURIES = new Set(TOPONYMS.flatMap((t) => t.historicalForms.map((f) => Math.floor(f.year / 100)))).size

/* -------- pipeline vignettes: each step shows the same word moving through the system -------- */
function StepFind() {
  const { t } = useI18n()
  return (
    <p className="m-0 font-[family-name:var(--font-display)] text-[1.0625rem] leading-relaxed italic" style={{ color: 'var(--ink-soft)' }}>
      {t.home.findBefore}{' '}
      <mark className="rounded-md px-1 py-0.5 not-italic" style={{ background: 'rgba(139,92,246,0.28)', color: 'var(--ink)', boxShadow: 'inset 0 -2px 0 #8B5CF6' }}>
        Gümişdərə
        <span className="tabular ml-1.5 align-middle font-[family-name:var(--font-sans)] text-[0.6875rem] font-semibold" style={{ color: 'var(--link)' }}>
          97%
        </span>
      </mark>{' '}
      {t.home.findAfter}
    </p>
  )
}
function StepVerify() {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface-sunk)' }}>
      <span className="min-w-0 flex-1">
        <span className="block font-[family-name:var(--font-display)] text-[1rem] italic" style={{ color: 'var(--ink)' }}>
          Gümişdərə <ArrowRight size={14} className="inline align-[-2px] not-italic" aria-hidden /> Gümüşdərə
        </span>
        <span className="tabular block text-[0.75rem]" style={{ color: 'var(--ink-faint)' }}>
          NM-TA-001 · 1593
        </span>
      </span>
      <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: '#F2B84B', color: '#3A2600' }}>
        <Check size={16} strokeWidth={2.6} />
      </span>
    </div>
  )
}
function StepMap() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-11 w-11 place-items-center">
        <PinMark size={36} tone="gold" />
      </span>
      <span>
        <span className="block font-[family-name:var(--font-display)] text-[1.125rem] font-semibold" style={{ color: 'var(--ink)' }}>
          Gümüşdərə
        </span>
        <span className="block text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          Гюмюшдере · Gumushdara
        </span>
      </span>
    </div>
  )
}

export default function Home() {
  const { t } = useI18n()
  const vignettes = [<StepFind key="f" />, <StepVerify key="v" />, <StepMap key="m" />]

  return (
    <>
      {/* ---------------- HERO: the atlas itself is the scene ---------------- */}
      <section className="relative -mt-16 flex flex-col overflow-hidden pt-16 lg:h-[100svh] lg:max-h-[980px] lg:min-h-[640px]" style={{ background: 'var(--page)' }}>
        <HeroMapWide />
        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pt-10 sm:px-6 md:pt-16 lg:flex lg:flex-1 lg:items-center lg:pt-0 lg:pb-16">
          <div className="max-w-[40rem] lg:max-w-[34rem] xl:max-w-[38rem]">
            <h1 className="text-[2.75rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-[3.75rem] lg:text-[4.5rem]" style={{ color: 'var(--ink)' }}>
              {t.home.title1}
              <br />
              <span className="gradient-headline">{t.home.title2}</span>
            </h1>
            <p className="mt-6 mb-0 max-w-[36rem] text-[1.125rem] leading-relaxed sm:text-[1.25rem]" style={{ color: 'var(--ink-soft)' }}>
              {t.home.lede}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={href({ page: 'atlas' })} className="btn-primary h-12 px-6 text-[1rem]">
                {t.home.ctaAtlas}
                <ArrowRight size={18} />
              </a>
              <a href={href({ page: 'ai' })} className="btn-quiet h-12 px-5 text-[1rem]" style={{ background: 'var(--glass-strong)' }}>
                <ScanText size={18} />
                {t.home.ctaAi}
              </a>
            </div>
            <div className="mt-6">
              <SampleBadge />
            </div>
          </div>
        </div>
        <HeroMapTall />
      </section>

      {/* ---------------- PIPELINE ---------------- */}
      <section aria-labelledby="steps-h" className="mx-auto max-w-[1320px] px-4 pt-20 pb-8 sm:px-6 lg:pt-28">
        <h2 id="steps-h" className="max-w-[18ch] text-[2rem] leading-tight sm:text-[2.75rem]" style={{ color: 'var(--ink)' }}>
          {t.home.stepsTitle}
        </h2>
        <ol className="relative mt-12 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-8">
          {/* connector line across the three steps */}
          <span
            aria-hidden
            className="absolute top-[22px] left-[22px] hidden h-[2px] w-[calc((100%-4rem)*2/3+4rem)] md:block"
            style={{ background: 'linear-gradient(90deg,#8B5CF6,#C4B5FD 50%,#F2B84B)' }}
          />
          {t.home.steps.map((s, i) => (
            <m.li
              key={s.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.45, delay: i * 0.12, ease }}
              className="relative"
            >
              <span
                className="tabular relative z-[1] grid h-11 w-11 place-items-center rounded-full border-2 font-[family-name:var(--font-display)] text-[1.125rem] font-semibold"
                style={{
                  background: 'var(--page)',
                  borderColor: i === 2 ? '#F2B84B' : '#8B5CF6',
                  color: i === 2 ? 'var(--gold-ink-on)' : 'var(--link)',
                }}
              >
                {i + 1}
              </span>
              <h3 className="mt-5 text-[1.5rem]" style={{ color: 'var(--ink)' }}>
                {s.t}
              </h3>
              <p className="mt-2 mb-5 max-w-[34ch] text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
                {s.d}
              </p>
              {vignettes[i]}
            </m.li>
          ))}
        </ol>
      </section>

      {/* ---------------- NUMBERS as a sentence ---------------- */}
      <section aria-labelledby="num-h" className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="border-y py-12 lg:py-16" style={{ borderColor: 'var(--line)' }}>
          <h2 id="num-h" className="mb-8 font-[family-name:var(--font-sans)] text-[1rem] font-medium tracking-normal" style={{ color: 'var(--ink-soft)' }}>
            {t.home.numbersTitle}
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {[
              { n: N_TOPONYMS, l: t.home.nToponyms },
              { n: N_FORMS, l: t.home.nForms },
              { n: N_VERIFIED, l: t.home.nVerified, gold: true },
              { n: N_CENTURIES, l: t.home.nCenturies },
            ].map((x) => (
              <div key={x.l} className="flex flex-col-reverse">
                <dt className="mt-1 text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
                  {x.l}
                </dt>
                <dd className="m-0 font-[family-name:var(--font-display)] text-[3.5rem] leading-none font-normal tracking-[-0.03em] sm:text-[4.5rem]">
                  <CountUp to={x.n} style={{ color: x.gold ? 'var(--gold-figure)' : 'var(--ink)' }} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- PARTNERS ---------------- */}
      <section aria-labelledby="partners-h" className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6">
        <h2 id="partners-h" className="text-[2rem] sm:text-[2.5rem]" style={{ color: 'var(--ink)' }}>
          {t.home.partnersTitle}
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
          {[
            { abbr: 'BSU', name: t.home.partnerBsu, role: t.home.partnerBsuRole },
            { abbr: 'ADNSU', name: t.home.partnerAdnsu, role: t.home.partnerAdnsuRole },
          ].map((p) => (
            <div key={p.abbr} className="flex gap-5">
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border font-[family-name:var(--font-display)] text-[1rem] font-semibold tracking-[0.02em]"
                style={{ borderColor: 'var(--line-strong)', color: 'var(--link)' }}
                aria-hidden
              >
                {p.abbr}
              </span>
              <div>
                <h3 className="text-[1.375rem] leading-snug" style={{ color: 'var(--ink)' }}>
                  {p.name}
                </h3>
                <p className="mt-2 mb-0 text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
                  {p.role}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 mb-0 max-w-[60ch] text-[0.9375rem]" style={{ color: 'var(--ink-faint)' }}>
          {t.home.grant}
        </p>
      </section>

      {/* ---------------- CLOSE ---------------- */}
      <section className="relative overflow-hidden border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="absolute inset-0" style={{ background: 'var(--surface-sunk)' }} aria-hidden />
        <div className="relative mx-auto flex max-w-[1320px] flex-col items-start gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-24">
          <div>
            <h2 className="max-w-[20ch] text-[2rem] leading-tight sm:text-[2.5rem]" style={{ color: 'var(--ink)' }}>
              {t.home.closeTitle}
            </h2>
            <p className="mt-3 mb-0 max-w-[48ch] text-[1.0625rem]" style={{ color: 'var(--ink-soft)' }}>
              {t.home.closeText}
            </p>
          </div>
          <a href={href({ page: 'atlas' })} className="btn-primary h-12 shrink-0 px-6 text-[1rem]">
            {t.home.ctaAtlas}
            <ArrowRight size={18} />
          </a>
        </div>
      </section>
      <Footer />
    </>
  )
}
