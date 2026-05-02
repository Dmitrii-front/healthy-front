import type { DaySlots } from "@/features/booking";
import { isSameDay } from "@/features/booking";
import { cn } from "@/shared/lib/cn";

const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const RU_MONTHS_FULL = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

interface StepDateTimeProps {
  availability: DaySlots[];
  selectedDay: string | null;
  selectedTime: string | null;
  onSelectDay: (iso: string) => void;
  onSelectTime: (time: string) => void;
}

export function StepDateTime({
  availability,
  selectedDay,
  selectedTime,
  onSelectDay,
  onSelectTime,
}: StepDateTimeProps) {
  const day = selectedDay ? availability.find((d) => isSameDay(d.date, selectedDay)) : null;

  const morning = day?.slots.filter((s) => parseInt(s) < 12) ?? [];
  const afternoon = day?.slots.filter((s) => parseInt(s) >= 12) ?? [];

  return (
    <>
      {/* Horizontal date strip */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {availability.slice(0, 14).map((d) => {
          const dt = new Date(d.date);
          const sel = selectedDay !== null && isSameDay(d.date, selectedDay);
          const hasSlots = d.slots.length > 0;
          return (
            <button
              key={d.date}
              type="button"
              disabled={!hasSlots}
              onClick={() => onSelectDay(d.date)}
              className={cn(
                "flex w-[60px] shrink-0 flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors",
                sel
                  ? "border-graphite bg-graphite text-card-white"
                  : hasSlots
                    ? "border-hairline bg-card-white text-graphite"
                    : "border-hairline bg-card-white text-mist-graphite",
              )}
            >
              <span
                className={cn(
                  "text-[10.5px] uppercase tracking-[0.06em]",
                  sel ? "opacity-80" : "opacity-70",
                )}
              >
                {RU_WEEKDAYS_SHORT[dt.getDay()] ?? ""}
              </span>
              <span className="text-[19px] font-medium leading-tight tabular-nums">
                {dt.getDate()}
              </span>
              <span
                className={cn(
                  "text-[9.5px] tabular-nums",
                  sel ? "text-card-white/70" : "text-distant-graphite",
                )}
              >
                {hasSlots ? d.slots.length : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && day && (
        <div className="mt-5">
          <p className="mb-3 text-[13px] font-medium text-soft-graphite">
            {formatDayLong(selectedDay)}
          </p>
          {morning.length > 0 && (
            <SlotGroup
              label="Утро"
              slots={morning}
              selected={selectedTime}
              onSelect={onSelectTime}
            />
          )}
          {afternoon.length > 0 && (
            <SlotGroup
              label="День"
              slots={afternoon}
              selected={selectedTime}
              onSelect={onSelectTime}
            />
          )}
          {morning.length === 0 && afternoon.length === 0 && (
            <p className="text-[14px] text-distant-graphite">На этот день свободных окон нет.</p>
          )}
        </div>
      )}
    </>
  );
}

function SlotGroup({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: string[];
  selected: string | null;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {slots.map((s) => {
          const sel = selected === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={cn(
                "rounded-[10px] border py-3 text-[13px] font-medium tabular-nums transition-colors",
                sel
                  ? "border-graphite bg-graphite text-card-white"
                  : "border-hairline bg-card-white text-graphite",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDayLong(iso: string): string {
  const d = new Date(iso);
  const wd = RU_WEEKDAYS_SHORT[d.getDay()] ?? "";
  const m = RU_MONTHS_FULL[d.getMonth()] ?? "";
  return `${wd[0]?.toUpperCase()}${wd.slice(1)}, ${d.getDate()} ${m}`;
}
