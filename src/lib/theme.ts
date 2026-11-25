import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function read(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read)

  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1E0B3A' : '#F7F5FF')
    try {
      localStorage.setItem('ta-theme', theme)
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
    window.dispatchEvent(new CustomEvent('ta-theme', { detail: theme }))
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}

/** Subscribe to theme changes without owning them (map, charts). */
export function useThemeValue(): Theme {
  const [theme, setTheme] = useState<Theme>(read)
  useEffect(() => {
    const on = () => setTheme(read())
    window.addEventListener('ta-theme', on)
    return () => window.removeEventListener('ta-theme', on)
  }, [])
  return theme
}
