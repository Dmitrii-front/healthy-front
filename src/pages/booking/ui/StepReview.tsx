import type { Doctor } from "@/entities/doctor";
import { Icon } from "@/shared/ui/Icon";
import { ReviewLine } from "./ReviewLine";

interface StepReviewProps {
  doctor: Doctor;
  patientName: string;
  insurance: string | undefined;
  day: string | null;
  time: string | null;
  visitType: string;
  reason: string;
}

import { formatDayShortWithTime } from "@/features/booking";

export function StepReview({
  doctor,
  patientName,
  insurance,
  day,
  time,
  visitType,
  reason,
}: StepReviewProps) {
  return (
    <>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        Проверьте данные
      </p>
      <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
        <ReviewLine label="Доктор" value={doctor.name} />
        <ReviewLine label="Когда" value={day && time ? formatDayShortWithTime(day, time) : "—"} />
        <ReviewLine label="Тип визита" value={visitType} />
        <ReviewLine label="Пациент" value={patientName} />
        <ReviewLine label="Страховка" value={insurance ?? "—"} last />
      </div>

      {reason && (
        <div className="mt-3 rounded-xl bg-linen-shade p-3.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
            Примечания
          </p>
          <p className="m-0 text-[13.5px] leading-[1.5] text-soft-graphite">{reason}</p>
        </div>
      )}

      <div
        className="mt-3 flex items-start gap-2.5 rounded-xl p-3.5"
        style={{
          background: "color-mix(in oklch, var(--color-tinted-linen) 60%, var(--color-card-white))",
        }}
      >
        <Icon name="info" size={14} stroke={1.8} className="mt-0.5 shrink-0 text-brick-coral" />
        <p className="m-0 text-[12.5px] leading-[1.5] text-soft-graphite">
          Отмена или перенос — не позднее чем за 24 часа. Напомним за сутки по SMS и email.
        </p>
      </div>
    </>
  );
}
