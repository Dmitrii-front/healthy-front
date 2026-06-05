import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, Link, useMatches } from '@tanstack/react-router'
import { Suspense } from 'react'

import { useAuthStore } from '@/features/auth'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { AuthGateModal } from '@/widgets/auth-gate-modal'
import { DesktopRail } from '@/widgets/desktop-rail'
import { TabBar } from '@/widgets/tab-bar'

interface RouterContext {
  queryClient: QueryClient
}

// Whole SPA is a protected zone — auth (sign-in, sign-up, forgot/reset
// password, email verification) lives on the Astro marketing site at the
// browser root. Unauthenticated users still land in the SPA shell but see
// a brand-warm gate modal that punts them to Astro auth pages; this keeps
// the user visually anchored in Healthy rather than flashing a 404 page.
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

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
      <ErrorBoundary
        fallback={(error, reset) => (
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
        )}
      >
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
