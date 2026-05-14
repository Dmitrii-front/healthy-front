import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { APPOINTMENT_QUERIES, type AppointmentStatus } from "@/entities/appointment";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";

const RU_WEEKDAY = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const RU_FULL = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const RU_TIME = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "Подтверждено",
  pending: "Ожидает подтверждения",
  cancelled: "Отменено",
  completed: "Завершено",
};

const STATUS_PILL: Record<AppointmentStatus, string> = {
  confirmed:
    "bg-[oklch(92%_0.05_165)] border border-[oklch(86%_0.06_165)] text-[oklch(38%_0.08_165)]",
  pending: "bg-[oklch(94%_0.07_75)] border border-[oklch(88%_0.09_75)] text-pending-amber-deep",
  cancelled: "bg-linen-shade border border-hairline text-distant-graphite",
  completed: "bg-linen-shade border border-hairline text-distant-graphite",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  confirmed: "bg-[oklch(56%_0.13_165)]",
  pending: "bg-pending-amber-deep",
  cancelled: "bg-mist-graphite",
  completed: "bg-mist-graphite",
};

export function VisitDetailPage() {
  const { visitId } = useParams({ from: "/visits/$visitId" });
  const router = useRouter();
  const { data: visit } = useQuery(APPOINTMENT_QUERIES.detail(visitId));
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());

  const goBack = () => {
    if (router.history.canGoBack()) router.history.back();
    else void router.navigate({ to: "/visits", search: { tab: "upcoming" } });
  };

  if (!visit) {
    return (
      <div className="px-5 pt-8 md:px-0 md:pt-0">
        <BackButton onClick={goBack} />
        <p className="mt-6 text-[14px] text-distant-graphite">Загружаем визит…</p>
      </div>
    );
  }

  const doctor = doctors.find((d) => d.id === visit.doctorId);
  const date = new Date(visit.date);
  const isPast = date.getTime() < Date.now() || visit.status === "completed";

  return (
    <div className="px-4 pt-6 pb-10 md:px-0 md:pt-0 md:pb-0">
      <BackButton onClick={goBack} />

      <header className="mt-5">
        <span
          className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 pl-2 text-[11.5px] font-medium leading-none ${STATUS_PILL[visit.status]}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[visit.status]}`} />
          {STATUS_LABEL[visit.status]}
        </span>
        <h1 className="mt-3 text-[28px] font-medium leading-[1.08] tracking-[-0.022em] text-graphite text-pretty">
          {visit.type}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-soft-graphite">
          {cap(RU_WEEKDAY.format(date))}, {RU_FULL.format(date)} · {RU_TIME.format(date)} ·{" "}
          {visit.duration} мин
        </p>
      </header>

      {doctor && (
        <section className="mt-7">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
            Доктор
          </p>
          <div className="flex items-center gap-3 rounded-[16px] border border-hairline bg-card-white p-3.5">
            <Avatar initials={doctor.initials} color={doctor.color} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-tight tracking-[-0.005em] text-graphite text-pretty">
                {doctor.name}
              </p>
              <p className="mt-0.5 text-[13px] text-distant-graphite">{doctor.specialty}</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-7">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
          Клиника
        </p>
        <div className="rounded-[16px] border border-hairline bg-card-white p-4">
          <p className="text-[14.5px] font-medium leading-tight text-graphite">{visit.clinic}</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(visit.clinic)}`}
            target="_blank"
            rel="noopener"
            className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-clinic-teal hover:text-brick-teal"
          >
            <Icon name="pin" size={14} stroke={1.8} />
            Маршрут
          </a>
        </div>
      </section>

      {visit.notes && (
        <section className="mt-7">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
            Заметка
          </p>
          <div className="rounded-[16px] border border-hairline bg-card-white p-4 text-[13.5px] leading-relaxed text-soft-graphite">
            <p>{visit.notes}</p>
          </div>
        </section>
      )}

      {!isPast && visit.status !== "cancelled" && (
        <section className="mt-7 flex flex-col gap-2.5 md:flex-row">
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center rounded-pill border border-hairline bg-card-white px-5 text-[14px] font-medium text-soft-graphite disabled:cursor-not-allowed disabled:opacity-70 md:flex-1"
            title="Скоро"
          >
            Перенести
          </button>
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center rounded-pill border border-hairline bg-card-white px-5 text-[14px] font-medium text-soft-graphite disabled:cursor-not-allowed disabled:opacity-70 md:flex-1"
            title="Скоро"
          >
            Отменить
          </button>
        </section>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 -ml-1 px-1 py-1 text-[13px] font-medium text-soft-graphite transition-colors hover:text-graphite"
    >
      <Icon name="chevron-left" size={16} stroke={2} />
      Назад
    </button>
  );
}
