import { lazy, Suspense, useEffect } from 'react'
import { LazyMotion, MotionConfig } from 'framer-motion'
import Home from './pages/Home'
import { Shell } from './components/Shell'
import { useRoute } from './lib/router'

const Atlas = lazy(() => import('./pages/Atlas'))
const AiDemo = lazy(() => import('./pages/AiDemo'))
const Stats = lazy(() => import('./pages/Stats'))
const About = lazy(() => import('./pages/About'))

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6" aria-hidden>
      <div className="skeleton mb-5 h-12 w-2/3 max-w-xl" />
      <div className="skeleton mb-3 h-4 w-full max-w-2xl" />
      <div className="skeleton h-4 w-4/5 max-w-xl" />
    </div>
  )
}

export default function App() {
  const route = useRoute()

  useEffect(() => {
    if (route.page !== 'atlas') window.scrollTo({ top: 0 })
  }, [route.page])

  return (
    <LazyMotion features={() => import('./motion-features').then((r) => r.default)} strict>
    <MotionConfig reducedMotion="user">
      <Shell route={route} fullBleed={route.page === 'atlas'}>
        <Suspense fallback={<PageSkeleton />}>
          {route.page === 'home' && <Home />}
          {route.page === 'atlas' && <Atlas id={route.id} />}
          {route.page === 'ai' && <AiDemo />}
          {route.page === 'stats' && <Stats />}
          {route.page === 'about' && <About />}
        </Suspense>
      </Shell>
    </MotionConfig>
    </LazyMotion>
  )
}
