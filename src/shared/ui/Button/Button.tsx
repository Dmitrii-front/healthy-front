import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  // Primary CTA carries the coral halo per DESIGN.md "CTA Halo" rule.
  primary:
    "bg-brick-coral text-card-white hover:bg-clinic-coral disabled:bg-mist-graphite disabled:text-card-white/80 disabled:shadow-none shadow-[0_6px_16px_color-mix(in_oklch,var(--color-brick-coral)_30%,transparent)]",
  secondary:
    "bg-card-white text-graphite border border-hairline-strong hover:bg-linen-shade disabled:text-distant-graphite",
  ghost: "border border-dashed border-hairline-strong text-distant-graphite hover:bg-linen-shade",
};

const SIZES: Record<Size, string> = {
  // md = pill CTA (14px / 28px / 15px / 500).
  md: "h-[46px] px-7 text-[15px] rounded-pill gap-3.5",
  lg: "h-[52px] px-7 text-[15.5px] rounded-md gap-3",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-[transform,background-color] duration-150",
        "active:scale-[0.985] disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
