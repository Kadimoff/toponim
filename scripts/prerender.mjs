// Post-build: snapshot the rendered landing page (AZ, dark) into dist/index.html so the first paint
// does not wait for JavaScript. React replaces it on mount; a guard drops it for other routes/languages.
// Needs a Chromium: set CHROME_PATH, or have Playwright's browsers installed (npx playwright install chromium).
import http from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { chromium } from 'playwright-core'

const dist = new URL('../dist/', import.meta.url).pathname
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = http
  .createServer((q, s) => {
    let p = join(dist, decodeURIComponent(q.url.split('?')[0]))
    if (!existsSync(p) || statSync(p).isDirectory()) p = join(dist, 'index.html')
    s.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' })
    s.end(readFileSync(p))
  })
  .listen(0, '127.0.0.1')
await new Promise((r) => server.once('listening', r))
const port = server.address().port

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const base = `${process.env.HOME}/.cache/ms-playwright/`
  if (!existsSync(base)) return undefined
  const dir = readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop()
  if (!dir) return undefined
  const sub = readdirSync(base + dir).find((d) => d.startsWith('chrome-headless-shell'))
  return `${base}${dir}/${sub}/chrome-headless-shell`
}

let browser
try {
  browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox', '--disable-dev-shm-usage'] })
} catch (e) {
  // No Chromium here: ship the client-rendered build as is.
  console.warn(`prerender skipped: ${e.message.split('\n')[0]}`)
  server.close()
  process.exit(0)
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const html = await page.evaluate(() => document.getElementById('root').innerHTML)
await browser.close()
server.close()

const guard = `<script>(function(){try{var h=location.hash,l=null,r=document.getElementById('root');try{l=localStorage.getItem('ta-lang')}catch(e){}if((h&&h!=='#/'&&h!=='#')||(l&&l!=='az')){r.innerHTML='';return}if(document.documentElement.dataset.theme==='light'){r.querySelectorAll('img').forEach(function(i){i.src=i.src.replace('map-dark','map-light');i.srcset=i.srcset.replace(/map-dark/g,'map-light')})}}catch(e){}})()</script>`
const indexPath = join(dist, 'index.html')
const out = readFileSync(indexPath, 'utf8').replace('<div id="root"></div>', `<div id="root">${html}</div>${guard}`)
writeFileSync(indexPath, out)
console.log(`prerendered landing: ${(html.length / 1024).toFixed(1)} KB of HTML`)
