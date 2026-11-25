import { useEffect, useState } from 'react'

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return match
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
