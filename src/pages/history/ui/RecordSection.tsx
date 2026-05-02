import type { ReactNode } from "react";

interface RecordSectionProps {
  title: string;
  last?: boolean;
  children: ReactNode;
}

export function RecordSection({ title, last, children }: RecordSectionProps) {
  return (
    <div className={last ? "mb-6" : "mb-[18px]"}>
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
        {title}
      </p>
      <div className="flex flex-col rounded-[14px] border border-hairline bg-card-white">
        {children}
      </div>
    </div>
  );
}
