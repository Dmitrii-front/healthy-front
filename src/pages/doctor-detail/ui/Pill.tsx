import type { ReactNode } from "react";

interface PillProps {
  tone?: "neutral" | "accent" | "success";
  children: ReactNode;
}

export function Pill({ tone = "neutral", children }: PillProps) {
  const toneCls =
    tone === "success"
      ? "bg-confirmed-sage/15 text-confirmed-sage"
      : tone === "accent"
        ? "bg-tinted-linen text-brick-coral"
        : "bg-linen-shade text-soft-graphite";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-[3px] text-[11.5px] font-medium ${toneCls}`}
    >
      {children}
    </span>
  );
}
