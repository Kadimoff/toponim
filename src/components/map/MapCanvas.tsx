import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import * as maplibregl from 'maplibre-gl'
// MapLibre 6 resolves its worker relative to its own chunk; the bundler does not emit it, so hand it the URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { Map as MLMap, Marker, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Lang } from '../../lib/data'
import { useThemeValue } from '../../lib/theme'
import { AZ_BOUNDS, loadBaseStyle, tintStyle } from './mapStyle'
import { SchematicMap } from './SchematicMap'

maplibregl.setWorkerUrl(workerUrl)

/** Anything with a name, a point and a review state can be a pin (demo toponyms and archive records). */
export interface MapPoint {
  id: string
  names: Record<Lang, string>
  coordinates: [number, number]
  status: 'verified' | 'pending'
}

export interface MapCanvasProps {
  toponyms: MapPoint[]
  visibleIds?: Set<string>
  selectedId?: string
  onSelect?: (id: string) => void
  lang: Lang
  interactive?: boolean
  /** extra padding so fitBounds/flyTo keep pins clear of floating panels */
  padding?: { top: number; right: number; bottom: number; left: number }
  pinLabel: (name: string) => string
  labels: { loading: string; fallback: string; zoomIn: string; zoomOut: string }
  /** stagger pin entrance (landing preview) */
  introStagger?: boolean
  /** fly the camera to the selected pin (off for the landing preview) */
  followSelection?: boolean
  onReady?: () => void
  /** group pins that overlap on screen (below zoom 9.5) into numbered cluster buttons */
  cluster?: boolean
  clusterLabel?: (n: number) => string
}

function pinSvg(state: 'default' | 'selected' | 'pending') {
  const disc = state === 'selected' ? '#F2B84B' : state === 'pending' ? '#4C1D95' : '#6D28D9'
  const ring = state === 'selected' ? '#FFF4DB' : '#DDD6FE'
  const pin = state === 'selected' ? '#3A2600' : '#F7F5FF'
  const dash = state === 'pending' ? ' stroke-dasharray="3 2.4"' : ''
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="${disc}"/><circle cx="16" cy="16" r="12.4" fill="none" stroke="${ring}" stroke-width="1.4"${dash}/><path d="M16 7.6c-3.5 0-6.2 2.6-6.2 6.1 0 4.3 6.2 10.6 6.2 10.6s6.2-6.3 6.2-10.6c0-3.5-2.7-6.1-6.2-6.1z" fill="${pin}"/><circle cx="16" cy="13.7" r="2.2" fill="${disc}"/></svg>`
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class MapBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e: unknown) {
    console.warn('[map] render error, schematic fallback:', e)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Interactive map with a guaranteed schematic fallback (no WebGL, blocked tiles, slow network, render error). */
export function MapCanvas(props: MapCanvasProps) {
  return (
    <MapBoundary
      fallback={
        <SchematicMap
          toponyms={props.toponyms}
          visibleIds={props.visibleIds}
          selectedId={props.selectedId}
          onSelect={props.onSelect}
          lang={props.lang}
          interactive={props.interactive}
          pinLabel={props.pinLabel}
          note={props.labels.fallback}
          introStagger={props.introStagger}
        />
      }
    >
      <MapCanvasInner {...props} />
    </MapBoundary>
  )
}

function MapCanvasInner(props: MapCanvasProps) {
  const { toponyms, visibleIds, selectedId, onSelect, lang, interactive = true, padding, pinLabel, labels, introStagger, followSelection = true, onReady, cluster = false, clusterLabel } = props
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const baseRef = useRef<StyleSpecification | null>(null)
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const theme = useThemeValue()
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const clusterMarkers = useRef(new Map<string, Marker>())
  const hiddenByCluster = useRef(new Set<string>())
  const [clusterTick, setClusterTick] = useState(0)
  const live = useRef({ toponyms, visibleIds, selectedId, padding, clusterLabel })
  live.current = { toponyms, visibleIds, selectedId, padding, clusterLabel }

  // screen-space greedy clustering; recomputed on zoom end and when the visible set changes (panning keeps distances)
  const recluster = useCallback(() => {
    const map = mapRef.current
    if (!map || !cluster) return
    const { toponyms: pts0, visibleIds: vis, selectedId: sel, clusterLabel: cl } = live.current
    const hidden = new Set<string>()
    const groups: MapPoint[][] = []
    if (map.getZoom() < 9.5) {
      const pts = pts0.filter((t) => (!vis || vis.has(t.id)) && t.id !== sel).map((t) => ({ t, p: map.project(t.coordinates) }))
      const used = new Set<string>()
      for (const a of pts) {
        if (used.has(a.t.id)) continue
        const g = pts.filter((b) => !used.has(b.t.id) && Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) < 34)
        g.forEach((b) => used.add(b.t.id))
        if (g.length > 1) {
          g.forEach((b) => hidden.add(b.t.id))
          groups.push(g.map((b) => b.t))
        }
      }
    }
    hiddenByCluster.current = hidden
    const want = new Map(groups.map((g) => [g.map((t) => t.id).sort().join('|'), g]))
    for (const [k, mk] of clusterMarkers.current) {
      if (!want.has(k)) {
        mk.remove()
        clusterMarkers.current.delete(k)
      }
    }
    for (const [k, g] of want) {
      if (clusterMarkers.current.has(k)) continue
      const lng = g.reduce((a, t) => a + t.coordinates[0], 0) / g.length
      const lat = g.reduce((a, t) => a + t.coordinates[1], 0) / g.length
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'pin-cluster'
      el.dataset.size = g.length > 9 ? 'l' : g.length > 4 ? 'm' : 's'
      el.textContent = String(g.length)
      const label = cl ? cl(g.length) : String(g.length)
      el.setAttribute('aria-label', label + ': ' + g.map((t) => t.names[lang]).slice(0, 6).join(', '))
      el.title = g.map((t) => t.names[lang]).slice(0, 8).join(', ') + (g.length > 8 ? '…' : '')
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        const b = new maplibregl.LngLatBounds()
        g.forEach((t) => b.extend(t.coordinates))
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        map.fitBounds(b, { padding: live.current.padding ?? 48, maxZoom: Math.max(map.getZoom() + 1.5, 9.6), duration: reduce ? 0 : 700 })
      })
      clusterMarkers.current.set(k, new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map))
    }
    setClusterTick((x) => x + 1)
  }, [cluster, lang])

  // --- create map once
  useEffect(() => {
    const ctrl = new AbortController()
    let map: MLMap | null = null
    let timeout = 0
    const fail = () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setState('fallback')
    }

    // one watchdog for the whole pipeline (style fetch + engine + first tiles): never leave a blank area
    timeout = window.setTimeout(() => {
      if (!mapRef.current || !mapRef.current.loaded()) {
        ctrl.abort()
        fail()
      }
    }, 12000)
    if (!hasWebGL()) {
      window.clearTimeout(timeout)
      setState('fallback')
      return
    }

    loadBaseStyle(ctrl.signal)
      .then((base) => {
        if (!host.current || ctrl.signal.aborted) return
        baseRef.current = base
        const m = new maplibregl.Map({
          container: host.current,
          style: tintStyle(base, (document.documentElement.dataset.theme as 'dark' | 'light') || 'dark', lang),
          bounds: AZ_BOUNDS,
          fitBoundsOptions: { padding: padding ?? 24 },
          interactive,
          attributionControl: { compact: true },
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: false,
          maxZoom: 13,
          minZoom: 5,
        })
        map = m
        mapRef.current = m
        m.touchZoomRotate?.disableRotation()
        if (interactive) {
          const nav = new maplibregl.NavigationControl({ showCompass: false })
          m.addControl(nav, 'bottom-right')
          // localise control labels
          requestAnimationFrame(() => {
            host.current?.querySelector('.maplibregl-ctrl-zoom-in')?.setAttribute('aria-label', labels.zoomIn)
            host.current?.querySelector('.maplibregl-ctrl-zoom-out')?.setAttribute('aria-label', labels.zoomOut)
            host.current?.querySelector('.maplibregl-ctrl-zoom-in')?.setAttribute('title', labels.zoomIn)
            host.current?.querySelector('.maplibregl-ctrl-zoom-out')?.setAttribute('title', labels.zoomOut)
          })
        }
        m.getCanvas().addEventListener('webglcontextlost', () => fail(), { once: true })
        m.once('load', () => {
          window.clearTimeout(timeout)
          setState('ready')
          onReady?.()
        })
        m.on('error', (e) => {
          // a single failed tile is fine; failure before first load means no basemap
          if (!m.loaded() && /style|source|Failed to fetch/i.test(String(e.error?.message ?? ''))) fail()
        })
      })
      .catch((e) => {
        // engine construction throws when WebGL exists but cannot create a context
        if ((e as Error).name !== 'AbortError') {
          console.warn('[map] falling back to schematic:', (e as Error).message)
          window.clearTimeout(timeout)
          fail()
        }
      })

    return () => {
      ctrl.abort()
      window.clearTimeout(timeout)
      markers.current.forEach(({ marker }) => marker.remove())
      markers.current.clear()
      clusterMarkers.current.forEach((mk) => mk.remove())
      clusterMarkers.current.clear()
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- theme re-tint
  useEffect(() => {
    const map = mapRef.current
    if (!map || !baseRef.current || state !== 'ready') return
    map.setStyle(tintStyle(baseRef.current, theme, lang), { diff: true })
  }, [theme, lang, state])

  // --- keep the whole country framed when nothing is selected and panels move
  useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready' || (selectedId && followSelection)) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.fitBounds(AZ_BOUNDS, { padding: padding ?? 24, duration: reduce ? 0 : 600 })
  }, [padding, selectedId, state, followSelection])

  // --- markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready') return
    const existing = markers.current
    const ids = new Set(toponyms.map((t) => t.id))
    for (const [id, { marker }] of existing) {
      if (!ids.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    }
    toponyms.forEach((t, i) => {
      if (existing.has(t.id)) return
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'pin'
      el.dataset.id = t.id
      if (!interactive) el.tabIndex = -1
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        onSelectRef.current?.(t.id)
      })
      if (introStagger) {
        el.style.opacity = '0'
        el.style.transform = 'translateY(-8px) scale(0.6)'
        el.style.transition = 'opacity 320ms cubic-bezier(.22,1,.36,1), transform 320ms cubic-bezier(.22,1,.36,1)'
        window.setTimeout(() => {
          el.style.opacity = '1'
          el.style.transform = ''
          window.setTimeout(() => (el.style.transition = ''), 400)
        }, 250 + i * 70)
      }
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(t.coordinates).addTo(map)
      existing.set(t.id, { marker, el })
    })
  }, [toponyms, state, interactive, introStagger])

  // --- clustering triggers
  useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready' || !cluster) return
    recluster()
    map.on('zoomend', recluster)
    return () => {
      map.off('zoomend', recluster)
    }
  }, [state, cluster, recluster, toponyms, visibleIds, selectedId])

  // --- marker state: visibility, selection, labels
  useEffect(() => {
    markers.current.forEach(({ el }, id) => {
      const t = toponyms.find((x) => x.id === id)
      if (!t) return
      const visible = (!visibleIds || visibleIds.has(id)) && !hiddenByCluster.current.has(id)
      const selected = id === selectedId
      el.style.display = visible ? '' : 'none'
      el.dataset.selected = String(selected)
      el.innerHTML = pinSvg(selected ? 'selected' : t.status === 'pending' ? 'pending' : 'default')
      el.setAttribute('aria-label', pinLabel(t.names[lang]))
      el.setAttribute('aria-pressed', String(selected))
      el.title = t.names[lang]
    })
  }, [toponyms, visibleIds, selectedId, lang, pinLabel, state, clusterTick])

  // --- fly to selection
  useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready' || !selectedId || !followSelection) return
    const t = toponyms.find((x) => x.id === selectedId)
    if (!t) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo({
      center: t.coordinates,
      zoom: Math.max(map.getZoom(), 8.4),
      padding: padding ?? undefined,
      duration: reduce ? 0 : 900,
      essential: true,
    })
  }, [selectedId, state, toponyms, padding, followSelection])

  if (state === 'fallback') {
    return (
      <SchematicMap
        toponyms={toponyms}
        visibleIds={visibleIds}
        selectedId={selectedId}
        onSelect={onSelect}
        lang={lang}
        interactive={interactive}
        pinLabel={pinLabel}
        note={labels.fallback}
        introStagger={introStagger}
      />
    )
  }

  return (
    <div className="absolute inset-0" style={{ background: 'var(--map-fallback)' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-label={interactive ? undefined : labels.loading} />
      {state === 'loading' && (
        <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
          <div className="skeleton absolute inset-0 rounded-none opacity-70" />
          <span className="relative text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
            {labels.loading}…
          </span>
        </div>
      )}
    </div>
  )
}
