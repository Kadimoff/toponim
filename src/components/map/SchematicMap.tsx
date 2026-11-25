import type { Lang, Toponym } from '../../lib/data'
import { AZ_BOUNDS } from './mapStyle'

/** Offline fallback: an equirectangular schematic with a coordinate graticule. No country outline — we never draw a border we cannot source. */
export function SchematicMap({
  toponyms,
  visibleIds,
  selectedId,
  onSelect,
  lang,
  interactive,
  pinLabel,
  note,
  introStagger,
}: {
  toponyms: Toponym[]
  visibleIds?: Set<string>
  selectedId?: string
  onSelect?: (id: string) => void
  lang: Lang
  interactive?: boolean
  pinLabel: (name: string) => string
  note: string
  introStagger?: boolean
}) {
  const [[w0, s0], [e0, n0]] = AZ_BOUNDS
  const k = Math.cos((40 * Math.PI) / 180)
  const W = (e0 - w0) * k
  const H = n0 - s0
  const pos = (lng: number, lat: number) => ({ x: ((lng - w0) * k) / W, y: (n0 - lat) / H })
  const lngLines = [46, 47, 48, 49, 50]
  const latLines = [39, 40, 41]

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--map-fallback)' }}>
      <div className="absolute inset-[6%]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {lngLines.map((l) => {
            const { x } = pos(l, 40)
            return <line key={l} x1={x * 100} x2={x * 100} y1={0} y2={100} stroke="var(--line)" strokeWidth="0.15" />
          })}
          {latLines.map((l) => {
            const { y } = pos(46, l)
            return <line key={l} y1={y * 100} y2={y * 100} x1={0} x2={100} stroke="var(--line)" strokeWidth="0.15" />
          })}
        </svg>
        {lngLines.map((l) => (
          <span key={l} className="tabular absolute -top-5 -translate-x-1/2 text-[11px]" style={{ left: `${pos(l, 40).x * 100}%`, color: 'var(--ink-faint)' }}>
            {l}°E
          </span>
        ))}
        {latLines.map((l) => (
          <span key={l} className="tabular absolute -left-1 -translate-x-full -translate-y-1/2 text-[11px]" style={{ top: `${pos(46, l).y * 100}%`, color: 'var(--ink-faint)' }}>
            {l}°N
          </span>
        ))}
        {toponyms.map((t, i) => {
          if (visibleIds && !visibleIds.has(t.id)) return null
          const { x, y } = pos(t.coordinates[0], t.coordinates[1])
          const sel = t.id === selectedId
          return (
            <button
              key={t.id}
              type="button"
              className="pin absolute -translate-x-1/2 -translate-y-1/2"
              data-selected={sel}
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                animation: introStagger ? `pinIn 320ms cubic-bezier(.22,1,.36,1) ${250 + i * 70}ms both` : undefined,
              }}
              tabIndex={interactive ? 0 : -1}
              aria-label={pinLabel(t.names[lang])}
              aria-pressed={sel}
              title={t.names[lang]}
              onClick={() => onSelect?.(t.id)}
            >
              <svg viewBox="0 0 32 32" aria-hidden>
                <circle cx="16" cy="16" r="15" fill={sel ? '#F2B84B' : t.status === 'pending' ? '#4C1D95' : '#6D28D9'} />
                <circle cx="16" cy="16" r="12.4" fill="none" stroke={sel ? '#FFF4DB' : '#DDD6FE'} strokeWidth="1.4" strokeDasharray={t.status === 'pending' && !sel ? '3 2.4' : undefined} />
                <path d="M16 7.6c-3.5 0-6.2 2.6-6.2 6.1 0 4.3 6.2 10.6 6.2 10.6s6.2-6.3 6.2-10.6c0-3.5-2.7-6.1-6.2-6.1z" fill={sel ? '#3A2600' : '#F7F5FF'} />
                <circle cx="16" cy="13.7" r="2.2" fill={sel ? '#F2B84B' : '#6D28D9'} />
              </svg>
            </button>
          )
        })}
      </div>
      {interactive && (
        <p role="status" className="glass absolute right-4 bottom-4 max-w-xs px-3 py-2 text-xs" style={{ color: 'var(--ink-soft)', borderRadius: 12 }}>
          {note}
        </p>
      )}
    </div>
  )
}
