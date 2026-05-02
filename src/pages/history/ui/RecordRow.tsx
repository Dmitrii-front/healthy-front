import { cn } from "@/shared/lib/cn";

interface RecordRowProps {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  last?: boolean;
}

const EMPTY = "—";

export function RecordRow({ label, value, multiline, last }: RecordRowProps) {
  const display = value && value.length > 0 ? value : EMPTY;
  const isEmpty = display === EMPTY;

  return (
    <div
      className={cn(
        "flex justify-between gap-3 px-3.5 py-3 text-[13.5px]",
        multiline ? "flex-col items-start gap-1" : "flex-row items-baseline",
        !last && "border-b border-hairline",
      )}
    >
      <span className="shrink-0 text-distant-graphite">{label}</span>
      <span
        className={cn(
          "min-w-0 overflow-hidden font-medium leading-[1.45]",
          isEmpty ? "text-mist-graphite" : "text-graphite",
          multiline ? "text-left whitespace-normal" : "text-right whitespace-nowrap text-ellipsis",
        )}
      >
        {display}
      </span>
    </div>
  );
}
