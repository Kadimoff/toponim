import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DICTS, type Dict } from './strings'
import type { Lang } from '../lib/data'

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
}
const I18n = createContext<Ctx | null>(null)

function initial(): Lang {
  try {
    const v = localStorage.getItem('ta-lang')
    if (v === 'az' || v === 'ru' || v === 'en') return v
  } catch {
    /* storage blocked */
  }
  return 'az'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial)
  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('ta-lang', lang)
    } catch {
      /* storage blocked */
    }
  }, [lang])
  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang])
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export function useI18n() {
  const c = useContext(I18n)
  if (!c) throw new Error('useI18n outside provider')
  return c
}
