interface StatProps {
  label: string;
  value: string;
  sub?: string | undefined;
  border?: boolean;
}

export function Stat({ label, value, sub, border }: StatProps) {
  return (
    <div className={`px-2 py-3.5 text-center ${border ? "border-l border-hairline" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        {label}
      </p>
      <p className="mt-1 text-[19px] font-medium text-graphite tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-distant-graphite">{sub}</p>}
    </div>
  );
}
