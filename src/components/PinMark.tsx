/** The product motif: a map pin held inside a circle. One drawing, reused everywhere. */
export function PinMark({
  size = 28,
  tone = 'violet',
  className,
  title,
}: {
  size?: number
  tone?: 'violet' | 'gold' | 'muted' | 'light'
  className?: string
  title?: string
}) {
  const palette = {
    violet: { disc: '#5B21B6', ring: '#C4B5FD', pin: '#EDE9FE', dot: '#5B21B6' },
    gold: { disc: '#F2B84B', ring: '#FFF4DB', pin: '#3A2600', dot: '#F2B84B' },
    muted: { disc: '#3B2470', ring: '#9A90BF', pin: '#C4B5FD', dot: '#3B2470' },
    light: { disc: 'transparent', ring: 'currentColor', pin: 'currentColor', dot: 'var(--page)' },
  }[tone]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <circle cx="16" cy="16" r="15" fill={palette.disc} />
      <circle cx="16" cy="16" r="12.4" fill="none" stroke={palette.ring} strokeWidth="1.4" />
      <path
        d="M16 7.6c-3.5 0-6.2 2.6-6.2 6.1 0 4.3 6.2 10.6 6.2 10.6s6.2-6.3 6.2-10.6c0-3.5-2.7-6.1-6.2-6.1z"
        fill={palette.pin}
      />
      <circle cx="16" cy="13.7" r="2.2" fill={palette.dot} />
    </svg>
  )
}
