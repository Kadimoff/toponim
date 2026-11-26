import type { Map as MLMap, StyleSpecification } from 'maplibre-gl'
import type { Theme } from '../../lib/theme'

export const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
export const AZ_BOUNDS: [[number, number], [number, number]] = [
  [45.0, 38.35],
  [50.65, 41.95],
]

const P = {
  dark: {
    land: '#26124a',
    landAlt: '#2c1655',
    water: '#43218a',
    waterLine: '#5b2fae',
    road: 'rgba(196,181,253,0.16)',
    roadMajor: 'rgba(196,181,253,0.28)',
    boundary: 'rgba(196,181,253,0.55)',
    label: '#bdb4dc',
    labelMajor: '#e9e6f5',
    waterLabel: '#c4b5fd',
    halo: '#1e0b3a',
    building: 'rgba(196,181,253,0.06)',
  },
  light: {
    land: '#f3f0fa',
    landAlt: '#ece7f8',
    water: '#cfc1f7',
    waterLine: '#b6a3f2',
    road: 'rgba(91,33,182,0.10)',
    roadMajor: 'rgba(91,33,182,0.2)',
    boundary: 'rgba(91,33,182,0.45)',
    label: '#6b6386',
    labelMajor: '#2e1065',
    waterLabel: '#5b21b6',
    halo: '#ffffff',
    building: 'rgba(91,33,182,0.05)',
  },
}

/** Re-tint OpenFreeMap Positron toward violet. Keyed on layer type + id so it survives style revisions. */
export function tintStyle(style: StyleSpecification, theme: Theme, lang: 'az' | 'ru' | 'en' = 'az'): StyleSpecification {
  const c = P[theme]
  const layers = style.layers.map((l) => {
    const id = l.id
    const layer = { ...l, paint: { ...(('paint' in l && l.paint) || {}) } } as typeof l & { paint: Record<string, unknown> }
    if (l.type === 'background') layer.paint['background-color'] = c.land
    else if (l.type === 'fill') {
      if (/water/.test(id)) layer.paint['fill-color'] = c.water
      else if (/building/.test(id)) layer.paint['fill-color'] = c.building
      else if (/park|landcover|landuse|wood|grass|ice/.test(id)) {
        layer.paint['fill-color'] = c.landAlt
        layer.paint['fill-opacity'] = 0.6
      } else layer.paint['fill-color'] = c.landAlt
      delete layer.paint['fill-pattern']
    } else if (l.type === 'line') {
      if (/waterway|water/.test(id)) layer.paint['line-color'] = c.waterLine
      else if (/boundary|admin/.test(id)) {
        layer.paint['line-color'] = c.boundary
      } else if (/motorway|trunk|primary/.test(id)) layer.paint['line-color'] = c.roadMajor
      else layer.paint['line-color'] = c.road
    } else if (l.type === 'symbol') {
      const water = /water|ocean|sea|lake|river/.test(id)
      const major = /country|state|city/.test(id)
      layer.paint['text-color'] = water ? c.waterLabel : major ? c.labelMajor : c.label
      layer.paint['text-halo-color'] = c.halo
      layer.paint['text-halo-width'] = 1.2
      if ('icon-color' in layer.paint) layer.paint['icon-color'] = c.label
      const layout = ('layout' in l && l.layout) as Record<string, unknown> | undefined
      if (layout && 'text-field' in layout && !/shield|ref|housenum/.test(id)) {
        ;(layer as unknown as { layout: Record<string, unknown> }).layout = {
          ...layout,
          'text-field': ['coalesce', ['get', `name:${lang}`], ['get', 'name:latin'], ['get', 'name']],
        }
      }
    }
    return layer
  })
  return { ...style, layers } as StyleSpecification
}

/** Snapshot of the Positron style served from our own origin (refresh: curl STYLE_URL > public/map/positron.json). */
export const LOCAL_STYLE_URL = `${import.meta.env.BASE_URL}map/positron.json`

async function fetchJson(url: string, signal: AbortSignal, ms: number) {
  const t = new AbortController()
  const timer = window.setTimeout(() => t.abort(), ms)
  const onAbort = () => t.abort()
  signal.addEventListener('abort', onAbort)
  try {
    const res = await fetch(url, { signal: t.signal })
    if (!res.ok) throw new Error(`style ${res.status}`)
    return (await res.json()) as StyleSpecification
  } finally {
    window.clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}

export async function loadBaseStyle(signal: AbortSignal): Promise<StyleSpecification> {
  try {
    return await fetchJson(LOCAL_STYLE_URL, signal, 5000)
  } catch (e) {
    if (signal.aborted) throw e
    return fetchJson(STYLE_URL, signal, 6000)
  }
}

export function applyTheme(map: MLMap, base: StyleSpecification, theme: Theme, lang: 'az' | 'ru' | 'en') {
  map.setStyle(tintStyle(base, theme, lang), { diff: true })
}
