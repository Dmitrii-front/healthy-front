const RU_MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

interface DateStampProps {
  date: Date;
  showTime?: boolean;
}

export function DateStamp({ date, showTime = true }: DateStampProps) {
  const month = RU_MONTHS[date.getMonth()];
  const day = date.getDate();
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex w-16 flex-col items-center justify-center py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-distant-graphite">
        {month}
      </span>
      <span className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-graphite tabular-nums">
        {day}
      </span>
      {showTime && (
        <>
          <span aria-hidden className="my-2 block h-px w-6 bg-black/5" />
          <span className="font-mono text-[13px] font-medium tracking-tight text-soft-graphite tabular-nums">
            {time}
          </span>
        </>
      )}
    </div>
  );
}
