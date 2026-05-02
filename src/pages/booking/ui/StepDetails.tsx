import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/lib/cn";

const VISIT_OPTIONS = [
  "Ежегодный осмотр",
  "Повторный приём",
  "Новая жалоба",
  "Анализы",
  "Выписка рецепта",
];

interface StepDetailsProps {
  visitType: string;
  reason: string;
  isNewPatient: boolean;
  onVisitType: (v: string) => void;
  onReason: (v: string) => void;
  onIsNewPatient: (v: boolean) => void;
}

export function StepDetails({
  visitType,
  reason,
  isNewPatient,
  onVisitType,
  onReason,
  onIsNewPatient,
}: StepDetailsProps) {
  return (
    <>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        Цель визита
      </p>
      <div className="mb-6 flex flex-col gap-1.5">
        {VISIT_OPTIONS.map((opt) => {
          const sel = visitType === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onVisitType(opt)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3.5 py-3.5 text-left text-[14.5px] transition-colors",
                sel
                  ? "border-graphite bg-tinted-linen text-graphite"
                  : "border-hairline bg-card-white text-graphite",
              )}
            >
              <span>{opt}</span>
              {sel && <Icon name="check" size={16} stroke={2.4} className="text-brick-coral" />}
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
          Примечания{" "}
          <span className="font-normal normal-case tracking-normal text-distant-graphite/80">
            (необязательно)
          </span>
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="Кратко опишите симптомы или вопросы…"
          className="block min-h-[100px] w-full resize-y rounded-xl border border-hairline-strong bg-card-white px-3.5 py-3 text-[14px] text-graphite outline-none placeholder:text-distant-graphite focus:border-soft-graphite"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-hairline-strong bg-card-white px-3.5 py-3">
        <input
          type="checkbox"
          checked={isNewPatient}
          onChange={(e) => onIsNewPatient(e.target.checked)}
          className="accent-brick-coral"
        />
        <span className="flex-1 text-[13.5px] text-soft-graphite">
          Это мой первый визит к этому доктору
        </span>
      </label>
    </>
  );
}
