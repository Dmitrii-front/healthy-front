import { Link } from "@tanstack/react-router";
import { SPECIALTIES, type Specialty } from "@/entities/specialty";
import { BodyIcon } from "@/shared/ui/BodyIcon";

export function SpecialtyGrid() {
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-semibold tracking-tight text-graphite">Категории</h2>
      <ul className="grid grid-cols-3 gap-2">
        {SPECIALTIES.map((s) => {
          if (s.key === "family-medicine") {
            return (
              <li key={s.key} className="col-span-2">
                <FamilyHeroTile specialty={s} />
              </li>
            );
          }
          if (s.key === "urgent-care") {
            return (
              <li key={s.key} className="col-span-1">
                <UrgentTile specialty={s} />
              </li>
            );
          }
          return (
            <li key={s.key} className="col-span-1">
              <DefaultTile specialty={s} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface TileProps {
  specialty: Specialty;
}

function searchTo(specialty: Specialty) {
  return {
    to: "/search",
    search: { specialty: specialty.doctorSpecialty },
  } as const;
}

function DefaultTile({ specialty }: TileProps) {
  return (
    <Link
      {...searchTo(specialty)}
      className="relative flex aspect-square w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[18px] border border-hairline bg-card-white px-2 py-3 text-center transition-transform active:scale-[0.985]"
    >
      <BodyIcon name={specialty.iconKey} size={52} />
      <span className="w-full truncate text-[13px] font-medium tracking-[-0.005em] text-soft-graphite">
        {specialty.label}
      </span>
    </Link>
  );
}

function FamilyHeroTile({ specialty }: TileProps) {
  return (
    <Link
      {...searchTo(specialty)}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-3.5 py-3 text-left transition-transform active:scale-[0.985]"
      style={{
        aspectRatio: "2.08 / 1",
        background: "color-mix(in oklch, var(--color-tinted-linen) 70%, var(--color-card-white))",
        border:
          "1px solid color-mix(in oklch, var(--color-brick-coral) 18%, var(--color-hairline))",
      }}
    >
      <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center">
        <BodyIcon name={specialty.iconKey} size={84} />
      </div>
      <div className="flex min-w-0 flex-col gap-px">
        <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brick-coral">
          Общая практика
        </span>
        <span className="text-[16px] font-medium leading-[1.05] tracking-[-0.014em] text-graphite">
          Семейный доктор
        </span>
        <span className="mt-0.5 text-[12px] text-distant-graphite">
          {specialty.count} докторов поблизости
        </span>
      </div>
    </Link>
  );
}

function UrgentTile({ specialty }: TileProps) {
  return (
    <Link
      {...searchTo(specialty)}
      className="relative flex aspect-square w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[18px] bg-card-white px-2 py-3 text-center transition-transform active:scale-[0.985]"
      style={{
        border:
          "1px solid color-mix(in oklch, var(--color-brick-coral) 28%, var(--color-hairline))",
      }}
    >
      <BodyIcon name={specialty.iconKey} size={52} />
      <span className="w-full truncate text-[13px] font-medium tracking-[-0.005em] text-soft-graphite">
        {specialty.label}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-16 w-16 overflow-hidden rounded-tr-[18px]"
      >
        <span
          className="absolute -right-[30px] top-[11px] w-[110px] rotate-[40deg] bg-brick-coral py-[3px] text-center font-mono text-[10px] font-bold tracking-[0.12em] text-card-white"
          style={{
            boxShadow: "0 1px 4px color-mix(in oklch, var(--color-brick-coral) 30%, transparent)",
          }}
        >
          24/7
        </span>
      </span>
    </Link>
  );
}
