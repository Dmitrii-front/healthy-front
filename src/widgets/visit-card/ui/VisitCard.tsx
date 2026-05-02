import type { Appointment, AppointmentStatus } from "@/entities/appointment";
import type { Doctor } from "@/entities/doctor";
import { Icon } from "@/shared/ui/Icon";
import { RU_MONTHS_SHORT } from "../lib/ru-months";

interface VisitCardProps {
  appointment: Appointment;
  doctor: Doctor;
  past?: boolean;
  primary?: boolean;
  onClick?: () => void;
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "Подтверждено",
  pending: "Ожидает подтверждения",
  cancelled: "Отменён",
  completed: "Завершено",
};

const STATUS_STRIPE: Record<AppointmentStatus, string> = {
  confirmed: "oklch(72% 0.14 160)",
  pending: "oklch(78% 0.16 75)",
  cancelled: "var(--color-distant-graphite)",
  completed: "var(--color-distant-graphite)",
};

const RU_TIME = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function VisitCard({
  appointment,
  doctor,
  past = false,
  primary = false,
  onClick,
}: VisitCardProps) {
  const date = new Date(appointment.date);
  const month = RU_MONTHS_SHORT[date.getMonth()] ?? "";
  const day = date.getDate();
  const isPending = appointment.status === "pending";

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full overflow-hidden rounded-[16px] border border-hairline bg-card-white text-left transition-transform active:scale-[0.99]"
      style={primary && !past ? { borderTopColor: "var(--color-tinted-linen)" } : undefined}
    >
      <div className="relative flex flex-col">
        <div className="relative flex items-stretch overflow-hidden">
          {/* 2px status stripe — only on upcoming/non-past cards */}
          {!past && (
            <span
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-[2px]"
              style={{ background: STATUS_STRIPE[appointment.status] }}
            />
          )}

          {/* Date column — month / day / hairline / time-or-year */}
          <div
            className={`flex w-16 shrink-0 flex-col items-center justify-center border-r border-hairline text-center ${
              primary && !past ? "py-3.5" : "py-3"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-distant-graphite">
              {month}
            </span>
            <span
              className={`mt-1 font-semibold leading-none tracking-[-0.02em] tabular-nums text-graphite ${
                primary && !past ? "text-[32px]" : "text-[28px]"
              }`}
            >
              {day}
            </span>
            <span aria-hidden className="my-2 block h-px w-6 bg-graphite/5" />
            <span className="font-mono text-[13px] font-medium tabular-nums tracking-[-0.01em] text-soft-graphite">
              {past ? date.getFullYear() : RU_TIME.format(date)}
            </span>
          </div>

          {/* Main column */}
          <div
            className={`flex min-w-0 flex-1 flex-col ${
              primary && !past ? "py-3.5 px-[18px]" : "py-3 px-3.5"
            }`}
          >
            <p className="font-display text-[16px] font-semibold text-graphite">
              {appointment.type}
            </p>

            {!past && (
              <span
                className={`mt-0.5 mb-1.5 inline-flex self-start text-[10px] font-semibold uppercase leading-none tracking-[0.12em] ${
                  isPending
                    ? "rounded-[4px] bg-pending-amber/10 px-1.5 py-1 text-pending-amber-deep"
                    : "text-distant-graphite"
                }`}
              >
                {STATUS_LABEL[appointment.status]} · {appointment.duration} мин
              </span>
            )}

            <p className={`text-[13.5px] font-medium text-graphite ${past ? "mt-1" : ""}`}>
              {doctor.name}
            </p>

            <p className="mt-1 flex items-center text-[12px] text-distant-graphite">
              <PinIcon className="mr-1 shrink-0" />
              {doctor.clinic}
            </p>
          </div>
        </div>

        {/* Prep note — hairline + info icon (upcoming only) */}
        {!past && appointment.notes && (
          <>
            <span aria-hidden className="block h-px bg-graphite/5 mx-[18px]" />
            <div className="flex items-start gap-2 px-[18px] py-3 text-[12.5px] leading-relaxed text-distant-graphite">
              <Icon name="info" size={13} stroke={2} className="mt-0.5 shrink-0" />
              <span>{appointment.notes}</span>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
