// DEV-ONLY: renders the tinted basemap for the landing hero so it can be saved as a static image.
// Not part of the production build (only index.html is a build input).
// Params: theme, w, h, pt, pr, pb, pl (frame size and padding around Azerbaijan, CSS px).
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AZ_BOUNDS, loadBaseStyle, tintStyle } from './components/map/mapStyle'
import { TOPONYMS } from './lib/data'

const q = new URLSearchParams(location.search)
const num = (k: string, d: number) => Number(q.get(k) ?? d)
const theme = (q.get('theme') as 'dark' | 'light') || 'dark'
const w = num('w', 640)
const h = num('h', 640)
const el = document.getElementById('m')!
el.style.width = `${w}px`
el.style.height = `${h}px`
const base = await loadBaseStyle(new AbortController().signal)
const map = new maplibregl.Map({
  container: el,
  style: tintStyle(base, theme, 'az'),
  bounds: AZ_BOUNDS,
  fitBoundsOptions: { padding: { top: num('pt', 24), right: num('pr', 24), bottom: num('pb', 24), left: num('pl', 24) } },
  interactive: false,
  attributionControl: false,
  canvasContextAttributes: { preserveDrawingBuffer: true },
})
map.once('idle', () => {
  const pins = Object.fromEntries(
    TOPONYMS.map((t) => {
      const p = map.project(t.coordinates)
      return [t.id, [+((p.x / w) * 100).toFixed(2), +((p.y / h) * 100).toFixed(2)]]
    }),
  )
  ;(window as unknown as { __pins: unknown }).__pins = pins
  document.title = 'ready'
})
