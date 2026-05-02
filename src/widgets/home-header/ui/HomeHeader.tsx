import { useQuery } from "@tanstack/react-query";
import { PATIENT_QUERIES } from "@/entities/patient";
import { Icon } from "@/shared/ui/Icon";

const RU_DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  day: "numeric",
});

export function HomeHeader() {
  const { data: patient } = useQuery(PATIENT_QUERIES.current());
  const today = RU_DATE_FMT.format(new Date());

  return (
    <header className="flex items-end justify-between gap-4 px-5 pt-3 pb-5">
      <div className="min-w-0">
        <p className="mb-0.5 text-[12.5px] font-medium tracking-[0.005em] text-distant-graphite">
          Сегодня, {today}
        </p>
        <h1 className="m-0 text-[32px] font-semibold leading-none tracking-[-0.026em] text-graphite">
          {patient?.firstName ?? "—"}
        </h1>
      </div>
      <button
        type="button"
        aria-label="Уведомления"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card-white text-soft-graphite shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
      >
        <Icon name="bell" size={17} stroke={1.7} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-clinic-coral ring-[1.5px] ring-card-white" />
      </button>
    </header>
  );
}
