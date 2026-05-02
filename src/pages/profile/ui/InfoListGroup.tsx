import type { ReactNode } from "react";

interface InfoListGroupProps {
  children: ReactNode;
}

export function InfoListGroup({ children }: InfoListGroupProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
      {children}
    </div>
  );
}

interface InfoListRowProps {
  label: string;
  value: string;
  last?: boolean;
}

export function InfoListRow({ label, value, last }: InfoListRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-[13px] text-[13px] ${
        last ? "" : "border-b border-hairline"
      }`}
    >
      <span className="shrink-0 text-distant-graphite">{label}</span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-right text-[13.5px] font-medium text-graphite">
        {value}
      </span>
    </div>
  );
}
