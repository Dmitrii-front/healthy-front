interface ReviewLineProps {
  label: string;
  value: string;
  last?: boolean;
}

export function ReviewLine({ label, value, last }: ReviewLineProps) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 px-4 py-3.5 text-[14px] ${
        last ? "" : "border-b border-hairline"
      }`}
    >
      <span className="shrink-0 text-[12.5px] text-distant-graphite">{label}</span>
      <span className="text-right font-medium text-graphite">{value}</span>
    </div>
  );
}
