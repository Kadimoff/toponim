import { useEffect, useState } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'atlas'; id?: string }
  | { page: 'ai' }
  | { page: 'stats' }
  | { page: 'about' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  switch (parts[0]) {
    case 'atlas':
      return { page: 'atlas', id: parts[1] ? decodeURIComponent(parts[1]) : undefined }
    case 'ai':
      return { page: 'ai' }
    case 'stats':
      return { page: 'stats' }
    case 'about':
      return { page: 'about' }
    default:
      return { page: 'home' }
  }
}

export function href(route: Route): string {
  if (route.page === 'home') return '#/'
  if (route.page === 'atlas' && route.id) return `#/atlas/${encodeURIComponent(route.id)}`
  return `#/${route.page}`
}

export function navigate(route: Route, replace = false) {
  const h = href(route)
  if (replace) history.replaceState(null, '', h)
  else history.pushState(null, '', h)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', on)
    window.addEventListener('popstate', on)
    return () => {
      window.removeEventListener('hashchange', on)
      window.removeEventListener('popstate', on)
    }
  }, [])
  return route
}
