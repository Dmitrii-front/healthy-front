import type { ReactNode } from "react";
import { Sheet } from "@/shared/ui/Sheet";
import { Chip } from "@/shared/ui/Chip";
import { Button } from "@/shared/ui/Button";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  specialties: string[];
  selectedSpecialty: string;
  onSelectSpecialty: (s: string) => void;
  resultCount: number;
  onReset: () => void;
}

export function FilterSheet({
  open,
  onClose,
  specialties,
  selectedSpecialty,
  onSelectSpecialty,
  resultCount,
  onReset,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Фильтры">
      <FilterGroup label="Специальность">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={selectedSpecialty === "all"} onClick={() => onSelectSpecialty("all")}>
            Все
          </Chip>
          {specialties.map((s) => (
            <Chip key={s} active={selectedSpecialty === s} onClick={() => onSelectSpecialty(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Страховка">
        <div className="flex flex-wrap gap-1.5">
          {["ОМС", "ДМС", "Самостоятельно"].map((s, i) => (
            <Chip key={s} active={i === 0}>
              {s}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Когда">
        <div className="flex flex-wrap gap-1.5">
          {["Любое время", "Сегодня", "На этой неделе", "Онлайн"].map((s, i) => (
            <Chip key={s} active={i === 0}>
              {s}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Расстояние" last>
        <div className="flex flex-wrap gap-1.5">
          {["1 км", "5 км", "10 км", "25 км"].map((s, i) => (
            <Chip key={s} active={i === 2}>
              {s}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <div className="mt-2 flex gap-2">
        <Button
          variant="secondary"
          full
          onClick={() => {
            onReset();
            onClose();
          }}
        >
          Сбросить
        </Button>
        <Button full onClick={onClose}>
          Показать {resultCount}
        </Button>
      </div>
    </Sheet>
  );
}

function FilterGroup({
  label,
  last,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "mb-2" : "mb-4 border-b border-hairline pb-4"}>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
        {label}
      </p>
      {children}
    </div>
  );
}
