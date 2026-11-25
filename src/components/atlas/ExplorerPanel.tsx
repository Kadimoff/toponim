import { useId } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { RotateCcw, Search, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import { PERIODS, STATUSES, TYPES, type Period, type Status, type Toponym, type ToponymType } from '../../lib/data'
import { PinMark } from '../PinMark'

export interface Filters {
  types: Set<ToponymType>
  periods: Set<Period>
  statuses: Set<Status>
}

export const emptyFilters = (): Filters => ({ types: new Set(), periods: new Set(), statuses: new Set() })
export const filtersActive = (f: Filters) => f.types.size + f.periods.size + f.statuses.size > 0

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return n
}

function ChipGroup<T extends string>({
  label,
  values,
  selected,
  render,
  onToggle,
}: {
  label: string
  values: readonly T[]
  selected: Set<T>
  render: (v: T) => string
  onToggle: (v: T) => void
}) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id}>
      <div id={id} className="mb-2 text-[0.75rem] font-semibold" style={{ color: 'var(--ink-faint)' }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = selected.has(v)
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(v)}
              className="h-8 rounded-full border px-3 text-[0.8125rem] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95"
              style={{
                borderColor: on ? '#8B5CF6' : 'var(--line)',
                background: on ? 'rgba(139,92,246,0.22)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)',
              }}
            >
              {render(v)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, inputRef }: { value: string; onChange: (v: string) => void; inputRef?: React.Ref<HTMLInputElement> }) {
  const { t } = useI18n()
  return (
    <div className="relative">
      <label htmlFor="toponym-search" className="sr-only">
        {t.atlas.searchLabel}
      </label>
      <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
      <input
        id="toponym-search"
        ref={inputRef}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.atlas.searchPh}
        className="h-12 w-full rounded-[10px] border pr-10 pl-10 text-[1rem] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--ink-faint)] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.3)] [&::-webkit-search-cancel-button]:hidden"
        style={{ background: 'var(--surface-sunk)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear"
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-[var(--chip)]"
          style={{ color: 'var(--ink-soft)' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-4">
      <ChipGroup label={t.atlas.type} values={TYPES} selected={filters.types} render={(v) => t.types[v]} onToggle={(v) => onChange({ ...filters, types: toggle(filters.types, v) })} />
      <ChipGroup label={t.atlas.period} values={PERIODS} selected={filters.periods} render={(v) => t.periods[v]} onToggle={(v) => onChange({ ...filters, periods: toggle(filters.periods, v) })} />
      <ChipGroup label={t.atlas.status} values={STATUSES} selected={filters.statuses} render={(v) => t.status[v]} onToggle={(v) => onChange({ ...filters, statuses: toggle(filters.statuses, v) })} />
    </div>
  )
}

export function ResultList({
  items,
  selectedId,
  onSelect,
  onReset,
}: {
  items: Toponym[]
  selectedId?: string
  onSelect: (id: string) => void
  onReset: () => void
}) {
  const { t, lang } = useI18n()
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <PinMark size={44} tone="muted" />
        <p className="mt-4 mb-1 font-[family-name:var(--font-display)] text-[1.25rem]" style={{ color: 'var(--ink)' }}>
          {t.atlas.emptyTitle}
        </p>
        <p className="m-0 max-w-[32ch] text-[0.9375rem]" style={{ color: 'var(--ink-soft)' }}>
          {t.atlas.emptyText}
        </p>
        <button type="button" onClick={onReset} className="btn-quiet mt-5 text-[0.875rem]">
          <RotateCcw size={15} />
          {t.atlas.reset}
        </button>
      </div>
    )
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      <AnimatePresence initial={false}>
        {items.map((it) => {
          const sel = it.id === selectedId
          return (
            <m.li
              key={it.id}
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                aria-current={sel ? 'true' : undefined}
                className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--chip)]"
                style={{ background: sel ? 'rgba(139,92,246,0.2)' : undefined }}
              >
                <PinMark size={26} tone={sel ? 'gold' : it.status === 'pending' ? 'muted' : 'violet'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[1rem] font-medium" style={{ color: 'var(--ink)' }}>
                    {it.names[lang]}
                  </span>
                  <span className="block truncate text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
                    {t.types[it.type]} · {t.atlas.firstSeen} <span className="tabular">{it.firstYear}</span>
                  </span>
                </span>
                {it.status === 'verified' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-label={t.status.verified} role="img" className="shrink-0">
                    <circle cx="8" cy="8" r="7.5" fill="#F2B84B" />
                    <path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#3A2600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </m.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
