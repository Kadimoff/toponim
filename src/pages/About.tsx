import { m } from 'framer-motion'
import { useI18n } from '../i18n'
import { Footer } from '../components/Footer'
import { PinMark } from '../components/PinMark'

const ease = [0.22, 1, 0.36, 1] as const

export default function About() {
  const { t } = useI18n()
  const roles = [
    { abbr: 'BSU', name: t.home.partnerBsu, role: t.home.partnerBsuRole },
    { abbr: 'ADNSU', name: t.home.partnerAdnsu, role: t.home.partnerAdnsuRole },
  ]
  const n = t.about.roadmap.length
  return (
    <>
      <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-16 sm:px-6 lg:pt-16">
        <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-[3.25rem]" style={{ color: 'var(--ink)' }}>
          {t.about.title}
        </h1>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 className="text-[1.75rem]" style={{ color: 'var(--ink)' }}>
            {t.about.goalTitle}
          </h2>
          <p className="m-0 max-w-[65ch] text-[1.125rem] leading-[1.75]" style={{ color: 'var(--ink-soft)' }}>
            {t.about.goal}
          </p>
        </div>

        <div className="mt-20 grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 className="text-[1.75rem]" style={{ color: 'var(--ink)' }}>
            {t.about.rolesTitle}
          </h2>
          <ul className="m-0 flex list-none flex-col divide-y p-0" style={{ borderColor: 'var(--line)' }}>
            {roles.map((r) => (
              <li key={r.abbr} className="flex gap-5 py-6 first:pt-0" style={{ borderColor: 'var(--line)' }}>
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] border text-[0.875rem] font-medium"
                  style={{ borderColor: 'var(--line-strong)', color: 'var(--link)' }}
                  aria-hidden
                >
                  {r.abbr}
                </span>
                <div>
                  <h3 className="text-[1.25rem] leading-snug" style={{ color: 'var(--ink)' }}>
                    {r.name}
                  </h3>
                  <p className="mt-2 mb-0 text-[1rem]" style={{ color: 'var(--ink-soft)' }}>
                    {r.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* roadmap: the same violet→gold line the atlas uses for a name's history */}
      <section aria-labelledby="road-h" className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6">
        <h2 id="road-h" className="text-[1.75rem]" style={{ color: 'var(--ink)' }}>
          {t.about.roadmapTitle}
        </h2>
        <ol className="relative m-0 mt-10 grid list-none gap-8 p-0 md:grid-cols-6 md:gap-6">
          <span
            aria-hidden
            className="absolute top-[7px] right-[8%] left-[7px] hidden h-[2px] md:block"
            style={{ background: 'linear-gradient(90deg,#8B5CF6,#C4B5FD 60%,#F2B84B)' }}
          />
          <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-[2px] md:hidden" style={{ background: 'linear-gradient(180deg,#8B5CF6,#F2B84B)' }} />
          {t.about.roadmap.map((r, i) => {
            const last = i === n - 1
            return (
              <m.li
                key={r.m}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.4, delay: 0.05 * i, ease }}
                className="relative pl-8 md:pl-0"
              >
                <span
                  aria-hidden
                  className="absolute top-0 left-0 block h-4 w-4 rounded-full md:relative"
                  style={{
                    background: last ? '#F2B84B' : 'var(--page)',
                    border: `2px solid ${last ? '#F2B84B' : '#8B5CF6'}`,
                  }}
                />
                <span className="tabular mt-0 block text-[0.8125rem] font-medium md:mt-4" style={{ color: last ? 'var(--gold-ink-on)' : 'var(--link)' }}>
                  {r.m} {t.about.months}
                </span>
                <h3 className="mt-1 font-[family-name:var(--font-sans)] text-[1.0625rem] font-medium tracking-normal" style={{ color: 'var(--ink)' }}>
                  {r.t}
                </h3>
                <p className="mt-1 mb-0 text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
                  {r.d}
                </p>
              </m.li>
            )
          })}
        </ol>

        <p className="mt-16 mb-0 flex items-center gap-3 text-[0.9375rem]" style={{ color: 'var(--ink-faint)' }}>
          <PinMark size={22} tone="muted" />
          {t.about.contact}
        </p>
      </section>
      <Footer />
    </>
  )
}
