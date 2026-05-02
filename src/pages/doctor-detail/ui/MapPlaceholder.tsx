interface MapPlaceholderProps {
  pinLabel: string;
}

/**
 * Faux-map block — soft mint grid with a coral pin. No real tiles (we don't
 * want to ship a map SDK for a static screen).
 */
export function MapPlaceholder({ pinLabel }: MapPlaceholderProps) {
  return (
    <div
      className="relative mt-3 h-[140px] overflow-hidden rounded-xl border border-hairline"
      style={{
        background: "oklch(95% 0.02 165)",
        backgroundImage:
          "linear-gradient(to right, oklch(92% 0.025 165) 1px, transparent 1px), linear-gradient(to bottom, oklch(92% 0.025 165) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <div className="rounded-pill bg-brick-coral px-2.5 py-1 text-[11px] font-medium text-card-white whitespace-nowrap">
          {pinLabel}
        </div>
        <div
          className="mx-auto h-0 w-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: "5px solid var(--color-brick-coral)",
          }}
        />
      </div>
    </div>
  );
}
