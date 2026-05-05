import type { InputHTMLAttributes, Ref } from "react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconName } from "@/shared/ui/Icon";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: IconName;
  invalid?: boolean;
  /** Show an eye toggle for password fields. Switches `type` between `password` and `text`. */
  revealable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ ref, icon, invalid, revealable, type, className, ...rest }: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable && revealed ? "text" : type;

  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 h-12.5 pl-3.5 bg-card-white border rounded-md",
        revealable ? "pr-1" : "pr-3.5",
        "transition-[border-color,box-shadow] duration-150 focus-within:ring-2",
        invalid
          ? "border-brick-coral focus-within:border-brick-coral focus-within:ring-brick-coral/20"
          : "border-hairline-strong focus-within:border-clinic-coral focus-within:ring-clinic-coral/15",
        className,
      )}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          className={cn(
            "shrink-0 transition-colors duration-150",
            invalid
              ? "text-brick-coral/80"
              : "text-distant-graphite group-focus-within:text-clinic-coral/70",
          )}
        />
      )}
      <input
        ref={ref}
        type={effectiveType}
        className="flex-1 h-full min-w-0 border-0 outline-none bg-transparent text-[15.5px] text-graphite placeholder:text-distant-graphite"
        {...rest}
      />
      {revealable && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={revealed}
          className="shrink-0 grid h-11 w-11 place-items-center rounded-md text-distant-graphite hover:text-graphite focus-visible:outline focus-visible:outline-clinic-coral/40"
        >
          <Icon name={revealed ? "eye-off" : "eye"} size={18} />
        </button>
      )}
    </div>
  );
}
