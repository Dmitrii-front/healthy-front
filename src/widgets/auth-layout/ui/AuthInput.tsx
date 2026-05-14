import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconName } from "@/shared/ui/Icon";

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: IconName;
  invalid?: boolean;
  /** Show an eye toggle for password fields. Switches `type` between `password` and `text`. */
  revealable?: boolean;
  /** Optional trailing slot — overrides the eye toggle when provided. */
  suffix?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Teal-themed input matching the mobile design — 52px tall, 14px radius,
 * 4px focus halo (`teal-brand-soft`), 18px leading mail/lock icon. Lives
 * inside the auth widget so the global `Input` component (used elsewhere
 * with the coral palette) stays untouched.
 */
export function AuthInput({
  ref,
  icon,
  invalid,
  revealable,
  suffix,
  type,
  className,
  ...rest
}: AuthInputProps) {
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable && revealed ? "text" : type;

  return (
    <div
      className={cn(
        "flex h-[52px] items-center gap-3 rounded-[14px] border bg-white pr-4 pl-4 transition-[border-color,box-shadow] duration-150 lg:h-[50px] lg:rounded-[12px]",
        "focus-within:ring-4",
        invalid
          ? "border-brick-teal focus-within:border-brick-teal focus-within:ring-brick-teal/20"
          : "border-auth-border focus-within:border-clinic-teal focus-within:ring-teal-brand-soft",
        className,
      )}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          stroke={1.6}
          className={cn("shrink-0", invalid ? "text-brick-teal/80" : "text-auth-muted")}
        />
      )}
      <input
        ref={ref}
        type={effectiveType}
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[16px] text-auth-ink outline-none placeholder:text-auth-muted lg:text-[15px]"
        {...rest}
      />
      {suffix
        ? suffix
        : revealable && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={revealed}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-auth-muted hover:text-auth-ink-2 focus-visible:outline focus-visible:outline-clinic-teal/40"
            >
              <Icon name={revealed ? "eye-off" : "eye"} size={18} stroke={1.6} />
            </button>
          )}
    </div>
  );
}
