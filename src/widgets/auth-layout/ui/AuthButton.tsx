import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

/**
 * Teal-themed pill CTA from the mobile design. 54px tall, weight 600,
 * dual-layer teal halo on primary; transparent + ink border on secondary.
 */
export function AuthButton({
  variant = "primary",
  className,
  disabled,
  children,
  ...rest
}: AuthButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex h-[54px] w-full items-center justify-center rounded-pill text-[16px] font-semibold transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:active:scale-100 lg:h-[50px] lg:text-[15px]",
        variant === "primary"
          ? "bg-teal-brand text-white shadow-[0_1px_2px_rgba(14,124,140,0.2),0_8px_20px_rgba(14,124,140,0.2)] hover:-translate-y-px hover:bg-teal-brand-hover hover:shadow-[0_2px_4px_rgba(14,124,140,0.25),0_12px_28px_rgba(14,124,140,0.28)] disabled:bg-auth-muted disabled:text-white/85 disabled:shadow-none disabled:hover:translate-y-0"
          : "border border-auth-border bg-transparent text-auth-ink hover:bg-white",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
