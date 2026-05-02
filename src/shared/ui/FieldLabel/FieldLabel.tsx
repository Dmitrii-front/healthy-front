import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FieldLabel({ children, htmlFor, className }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-[13px] font-medium text-soft-graphite", className)}
    >
      {children}
    </label>
  );
}
