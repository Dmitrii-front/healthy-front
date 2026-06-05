import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  Link,
  Outlet,
  useMatches,
} from '@tanstack/react-router'
import { Suspense } from 'react'
import { z } from 'zod'

import { useAuthStore } from '@/features/auth'
// Page components are React.lazy-wrapped inside each slice's index.ts, so
// importing the slice through its public API still yields a per-page chunk
// while loaders stay eager (small modules — only query factories).
import { HistoryPage, historyLoader } from '@/pages/history'
import { HomePage, homeLoader } from '@/pages/home'
import { ProfilePage, profileLoader } from '@/pages/profile'
import { VisitDetailPage, visitDetailLoader } from '@/pages/visit-detail'
import { VisitsPage, visitsLoader } from '@/pages/visits'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { RouteError } from '@/shared/ui/RouteError'
import { AuthGateModal } from '@/widgets/auth-gate-modal'
import { DesktopRail } from '@/widgets/desktop-rail'
import { TabBar } from '@/widgets/tab-bar'

interface RouterContext {
  queryClient: QueryClient
}

// ─── Root layout ─────────────────────────────────────────────────────

function RootErrorFallback(error: Error, reset: () => void) {
  return (
    <div className='flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center'>
      <p className='text-distant-graphite text-xs tracking-[0.16em] uppercase'>
        Что-то пошло не так
      </p>
      <h1 className='text-2xl font-medium tracking-tight'>
        {error.message || 'Неизвестная ошибка'}
      </h1>
      <button
        onClick={reset}
        className='rounded-pill bg-clinic-teal text-card-white hover:bg-brick-teal px-6 py-3 text-sm font-medium'
      >
        Попробовать снова
      </button>
    </div>
  )
}

// Whole SPA is a protected zone — auth (sign-in, sign-up, forgot/reset
// password, email verification) lives on the Astro marketing site at the
// browser root. Unauthenticated users still land in the SPA shell but see
// a brand-warm gate modal that punts them to Astro auth pages; this keeps
// the user visually anchored in Healthy rather than flashing a 404 page.
function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const matches = useMatches()
  const hideTabBar = matches.some((m) => m.staticData?.hideTabBar)

  // Standalone routes opt out of the desktop side-rail and the mobile
  // pb-24 tab-bar clearance (e.g. booking/doctor-detail flows).
  const isStandalone = hideTabBar

  // Gate: unauthenticated → render only the brand-tinted modal screen.
  // No <Outlet />, so child route components don't mount and route loaders
  // don't see authed-required UI; the queries themselves still fire but
  // their results are invisible to the user.
  if (!isAuthenticated) {
    return (
      <div className='bg-warm-paper text-graphite relative min-h-dvh'>
        <AuthGateModal />
      </div>
    )
  }

  return (
    <div className='bg-warm-paper text-graphite min-h-dvh'>
      <ErrorBoundary fallback={RootErrorFallback}>
        <Suspense
          fallback={
            <div className='text-distant-graphite flex min-h-dvh items-center justify-center text-sm'>
              Загрузка…
            </div>
          }
        >
          {isStandalone ? (
            <main>
              <Outlet />
            </main>
          ) : (
            <div className='md:flex md:items-stretch'>
              <DesktopRail />
              <main className='min-w-0 flex-1 pb-24 md:pb-0'>
                <div className='md:mx-auto md:max-w-[820px] md:px-10 md:py-10'>
                  <Outlet />
                </div>
              </main>
            </div>
          )}
        </Suspense>
      </ErrorBoundary>
      <TabBar />
    </div>
  )
}

function NotFound() {
  return (
    <div className='flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center'>
      <p className='text-distant-graphite text-xs tracking-[0.16em] uppercase'>404</p>
      <h1 className='text-2xl font-medium tracking-tight'>Страница не найдена</h1>
      <Link
        to='/'
        className='rounded-pill bg-clinic-teal text-card-white hover:bg-brick-teal px-6 py-3 text-sm font-medium'
      >
        На главную
      </Link>
    </div>
  )
}

// ─── Route tree ──────────────────────────────────────────────────────

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: homeLoader,
  component: HomePage,
})

// Layout route for /visits/* — children declare their own components,
// loaders and search schemas. The detail route mounts here as a sibling
// of the list under the same path prefix.
const visitsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/visits',
  component: VisitsLayout,
})

function VisitsLayout() {
  return <Outlet />
}

const visitsSearchSchema = z.object({
  tab: z.enum(['upcoming', 'past']).default('upcoming'),
})

const visitsIndexRoute = createRoute({
  getParentRoute: () => visitsLayoutRoute,
  path: '/',
  validateSearch: (search) => visitsSearchSchema.parse(search),
  loader: visitsLoader,
  component: VisitsPage,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
})

const visitDetailRoute = createRoute({
  getParentRoute: () => visitsLayoutRoute,
  path: '/$visitId',
  loader: visitDetailLoader,
  component: VisitDetailPage,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  loader: profileLoader,
  component: ProfilePage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  loader: historyLoader,
  component: HistoryPage,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  visitsLayoutRoute.addChildren([visitsIndexRoute, visitDetailRoute]),
  profileRoute,
  historyRoute,
])
