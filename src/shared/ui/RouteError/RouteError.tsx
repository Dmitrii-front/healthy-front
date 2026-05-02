interface RouteErrorProps {
  error: Error;
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-distant-graphite">Ошибка загрузки</p>
      <h2 className="text-xl font-medium tracking-tight">
        {error.message || "Не удалось загрузить данные"}
      </h2>
      <button
        onClick={reset}
        className="rounded-pill border border-hairline-strong px-5 py-2.5 text-sm font-medium text-graphite hover:bg-linen-shade"
      >
        Повторить
      </button>
    </div>
  );
}
