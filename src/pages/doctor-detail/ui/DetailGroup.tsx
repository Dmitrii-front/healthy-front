import type { ReactNode } from "react";

interface DetailGroupProps {
  label: string;
  children: ReactNode;
  /** Margin-top in px (defaults to 18). Pass 0 for the first group inside a tab. */
  mt?: number;
}

export function DetailGroup({ label, children, mt = 18 }: DetailGroupProps) {
  return (
    <div style={{ marginTop: mt }}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        {label}
      </p>
      <div className="text-[14px] leading-[1.5] text-soft-graphite">{children}</div>
    </div>
  );
}
