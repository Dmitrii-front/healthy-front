import {
  Outlet,
  createRootRouteWithContext,
  Link,
  redirect,
  useMatches,
} from "@tanstack/react-router";
import { Suspense } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { TabBar } from "@/widgets/tab-bar";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { authStore, hasPriorSignIn } from "@/features/auth";

interface RouterContext {
  queryClient: QueryClient;
}

const PUBLIC_ROUTES = new Set<string>(["/sign-in", "/sign-up", "/forgot-password"]);

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const isPublic = PUBLIC_ROUTES.has(location.pathname);
    const { isAuthenticated } = authStore.getState();

    if (!isAuthenticated && !isPublic) {
      const target = hasPriorSignIn() ? "/sign-in" : "/sign-up";
      throw redirect({
        to: target,
        search: { redirect: location.href },
      });
    }
    if (isAuthenticated && isPublic) {
      throw redirect({ to: "/" });
    }
  },
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const matches = useMatches();
  const hideTabBar = matches.some((m) => m.staticData?.hideTabBar);

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
              className="rounded-pill bg-clinic-coral px-6 py-3 text-sm font-medium text-card-white hover:bg-brick-coral"
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
          <main className={hideTabBar ? undefined : "pb-24"}>
            <Outlet />
          </main>
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
        className="rounded-pill bg-clinic-coral px-6 py-3 text-sm font-medium text-card-white hover:bg-brick-coral"
      >
        На главную
      </Link>
    </div>
  );
}
