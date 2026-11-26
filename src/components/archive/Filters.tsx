import { useId } from 'react'
import { BookOpenCheck, CircleDashed, Image as ImageIcon, Search, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useArc } from '../../i18n/arc'
import {
  ARC_PERIODS,
  ARC_TYPES,
  REGION_IDS,
  SOURCE_LANGS,
  VERIFICATIONS,
  formatWhen,
  type ArcFilters,
  type ArcIndexItem,
} from '../../lib/archive'
import { ChipGroup } from '../atlas/ExplorerPanel'

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return n
}

export function ArcSearchBox({ value, onChange, id = 'arc-search' }: { value: string; onChange: (v: string) => void; id?: string }) {
  const a = useArc()
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {a.searchLabel}
      </label>
      <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
      <input
        id={id}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={a.searchPh}
        className="h-12 w-full rounded-[10px] border pr-10 pl-10 text-[1rem] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[var(--ink-faint)] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.3)] [&::-webkit-search-cancel-button]:hidden"
        style={{ background: 'var(--surface-sunk)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={a.reset}
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-[var(--chip)]"
          style={{ color: 'var(--ink-soft)' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function RegionSelect({ value, onChange }: { value: Set<string>; onChange: (v: Set<string>) => void }) {
  const a = useArc()
  const id = useId()
  const cur = value.size === 1 ? [...value][0] : ''
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[0.75rem] font-semibold" style={{ color: 'var(--ink-faint)' }}>
        {a.fRegion}
      </label>
      <select
        id={id}
        value={cur}
        onChange={(e) => onChange(e.target.value ? new Set([e.target.value]) : new Set())}
        className="h-10 w-full rounded-[10px] border px-3 text-[0.9375rem] outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.3)]"
        style={{ background: 'var(--surface-sunk)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        <option value="">{a.allRegions}</option>
        {REGION_IDS.map((r) => (
          <option key={r} value={r}>
            {a.regions[r]}
          </option>
        ))}
        <option value="none">{a.regionNone}</option>
      </select>
    </div>
  )
}

export function ArcFilterBar({ filters, onChange, compact = false }: { filters: ArcFilters; onChange: (f: ArcFilters) => void; compact?: boolean }) {
  const a = useArc()
  return (
    <div className="flex flex-col gap-4">
      <ChipGroup label={a.fType} values={ARC_TYPES} selected={filters.types} render={(v) => a.types[v]} onToggle={(v) => onChange({ ...filters, types: toggle(filters.types, v) })} />
      <RegionSelect value={filters.regions} onChange={(regions) => onChange({ ...filters, regions })} />
      <ChipGroup
        label={a.fPeriod}
        values={[...ARC_PERIODS, 'unknown'] as const}
        selected={filters.periods}
        render={(v) => a.periods[v]}
        onToggle={(v) => onChange({ ...filters, periods: toggle(filters.periods, v) })}
      />
      <div className={compact ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        <ChipGroup label={a.fLang} values={SOURCE_LANGS} selected={filters.langs} render={(v) => a.langs[v]} onToggle={(v) => onChange({ ...filters, langs: toggle(filters.langs, v) })} />
        <ChipGroup
          label={a.fStatus}
          values={VERIFICATIONS}
          selected={filters.verifications}
          render={(v) => a.verification[v]}
          onToggle={(v) => onChange({ ...filters, verifications: toggle(filters.verifications, v) })}
        />
      </div>
    </div>
  )
}

export function VerificationChip({ v, small = false }: { v: 'sourced' | 'review'; small?: boolean }) {
  const a = useArc()
  const sourced = v === 'sourced'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${small ? 'px-2 py-0.5 text-[0.75rem]' : 'px-2.5 py-1 text-[0.8125rem]'}`}
      style={{
        borderColor: sourced ? 'rgba(139,92,246,0.55)' : 'var(--line-strong)',
        borderStyle: sourced ? 'solid' : 'dashed',
        background: sourced ? 'rgba(139,92,246,0.16)' : 'transparent',
        color: sourced ? 'var(--ink)' : 'var(--ink-soft)',
      }}
      title={a.verificationHint[v]}
    >
      {sourced ? <BookOpenCheck size={small ? 12 : 14} aria-hidden /> : <CircleDashed size={small ? 12 : 14} aria-hidden />}
      {a.verification[v]}
    </span>
  )
}

/** One-line description: type · region · date */
export function useMetaLine() {
  const a = useArc()
  const { lang } = useI18n()
  return (it: ArcIndexItem) =>
    [
      a.categories[it.category],
      it.region ? a.regions[it.region] : null,
      it.firstYear != null ? formatWhen({ year: it.firstYear, precision: 'year', bce: it.firstYear < 0 }, lang) : null,
    ]
      .filter(Boolean)
      .join(' · ')
}

export function ArcListItem({ it, selected, onSelect }: { it: ArcIndexItem; selected?: boolean; onSelect: (id: string) => void }) {
  const { lang } = useI18n()
  const meta = useMetaLine()
  return (
    <button
      type="button"
      onClick={() => onSelect(it.id)}
      aria-current={selected ? 'true' : undefined}
      className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--chip)]"
      style={{ background: selected ? 'rgba(139,92,246,0.2)' : undefined }}
    >
      <span
        aria-hidden
        className="legend-dot"
        style={{
          background: selected ? '#F2B84B' : it.verification === 'sourced' ? '#6D28D9' : 'transparent',
          border: it.verification === 'sourced' || selected ? '2px solid #DDD6FE' : '2px dashed var(--line-strong)',
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1rem] font-medium" style={{ color: 'var(--ink)' }}>
          {it.names[lang]}
        </span>
        <span className="block truncate text-[0.8125rem]" style={{ color: 'var(--ink-faint)' }}>
          {meta(it)}
        </span>
      </span>
      {it.hasImage && <ImageIcon size={14} aria-hidden className="shrink-0" style={{ color: 'var(--ink-faint)' }} />}
    </button>
  )
}
