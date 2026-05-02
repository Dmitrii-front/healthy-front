import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconName } from "@/shared/ui/Icon";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: IconName;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, invalid, className, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 h-[50px] px-3.5 bg-card-white border rounded-md",
        "transition-[border-color,box-shadow] duration-150",
        "focus-within:border-clinic-coral focus-within:ring-2 focus-within:ring-clinic-coral/15",
        invalid ? "border-clinic-coral" : "border-hairline-strong",
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} className="text-distant-graphite shrink-0" />}
      <input
        ref={ref}
        className="flex-1 h-full min-w-0 border-0 outline-none bg-transparent text-[15.5px] text-graphite placeholder:text-mist-graphite"
        {...rest}
      />
    </div>
  );
});
