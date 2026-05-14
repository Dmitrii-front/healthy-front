import { Outlet, createRootRouteWithContext, Link, useMatches } from "@tanstack/react-router";
import { Suspense } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { DesktopRail } from "@/widgets/desktop-rail";
import { TabBar } from "@/widgets/tab-bar";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

interface RouterContext {
  queryClient: QueryClient;
}

// TODO(auth-guard): re-enable beforeLoad redirect once Astro-side phone+SMS
// flow lands. Temporarily disabled so the SPA is browseable without tokens
// for prototype testing.
// const PUBLIC_ROUTES = new Set<string>(["/sign-in", "/sign-up", "/forgot-password"]);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const matches = useMatches();
  const hideTabBar = matches.some((m) => m.staticData?.hideTabBar);

  // Auth screens own their full-bleed layout (AuthLayout widget) and don't
  // want the desktop side-rail or the mobile pb-24 tab-bar clearance.
  const isStandalone = hideTabBar;

  return (
    <div className="min-h-dvh bg-warm-paper text-graphite">
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-distant-graphite">
              Что-то пошло не так
            </p>
            <h1 className="text-2xl font-medium tracking-tight">
              {error.message || "Неизвестная ошибка"}
            </h1>
            <button
              onClick={reset}
              className="rounded-pill bg-clinic-teal px-6 py-3 text-sm font-medium text-card-white hover:bg-brick-teal"
            >
              Попробовать снова
            </button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center text-sm text-distant-graphite">
              Загрузка…
            </div>
          }
        >
          {isStandalone ? (
            <main>
              <Outlet />
            </main>
          ) : (
            <div className="md:flex md:items-stretch">
              <DesktopRail />
              <main className="min-w-0 flex-1 pb-24 md:pb-0">
                <div className="md:mx-auto md:max-w-[820px] md:px-10 md:py-10">
                  <Outlet />
                </div>
              </main>
            </div>
          )}
        </Suspense>
      </ErrorBoundary>
      <TabBar />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-distant-graphite">404</p>
      <h1 className="text-2xl font-medium tracking-tight">Страница не найдена</h1>
      <Link
        to="/"
        className="rounded-pill bg-clinic-teal px-6 py-3 text-sm font-medium text-card-white hover:bg-brick-teal"
      >
        На главную
      </Link>
    </div>
  );
}
