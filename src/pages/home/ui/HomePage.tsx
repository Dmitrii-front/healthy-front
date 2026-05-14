import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { APPOINTMENT_QUERIES, type Appointment } from "@/entities/appointment";
import { DOCTOR_QUERIES, type Doctor } from "@/entities/doctor";
import { MEDICAL_RECORD_QUERIES, type MedicalRecord } from "@/entities/medical-record";
import { PATIENT_QUERIES } from "@/entities/patient";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";
import { HomeHero } from "@/widgets/home-hero";

const RU_FULL_DATE = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const RU_MONTH_DAY = new Intl.DateTimeFormat("ru-RU", { month: "short", day: "numeric" });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const stripDot = (s: string) => s.replace(/\.$/, "");

function greetingFor(hour: number): string {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export function HomePage() {
  const { data: appointments = [] } = useQuery(APPOINTMENT_QUERIES.list());
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());
  const { data: patient } = useQuery(PATIENT_QUERIES.current());
  const { data: medical } = useQuery(MEDICAL_RECORD_QUERIES.current());

  const now = new Date();
  const greeting = greetingFor(now.getHours());
  const today = cap(RU_FULL_DATE.format(now));
  // Patient query streams in after first paint; render the greeting without
  // a name until it lands, then update in place (no layout shift).
  const firstName = patient?.firstName;

  const pastVisits = appointments
    .filter((a) => new Date(a.date).getTime() < now.getTime() && a.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="px-4 pt-8 pb-2 md:px-0 md:pt-0 md:pb-0">
      <header className="mb-5">
        <h1 className="text-[26px] font-medium leading-[1.1] tracking-[-0.02em] text-graphite text-pretty">
          {greeting}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-1 text-[13.5px] text-distant-graphite">{today}</p>
      </header>

      <DoctorSearch />

      <div className="mt-6">
        <HomeHero appointments={appointments} doctors={doctors} />
      </div>

      {medical && <HealthSnapshot medical={medical} />}

      {pastVisits.length > 0 && <RecentVisits visits={pastVisits} doctors={doctors} />}
    </div>
  );
}

/* ── Health snapshot ─────────────────────────────────────────────────────── */

/* ── Doctor search (deep-links to /search on the marketing site) ─────────── */

function DoctorSearch() {
  return (
    <form
      action="/search"
      method="get"
      className="relative flex items-center gap-2 rounded-pill border border-hairline bg-card-white pl-4 pr-1.5 py-1.5 shadow-[0_2px_8px_-4px_rgba(15,17,21,0.06)] transition-[border-color,box-shadow] duration-150 focus-within:border-clinic-teal focus-within:shadow-[0_4px_16px_-6px_color-mix(in_oklch,var(--color-clinic-teal)_30%,transparent)]"
    >
      <Icon name="search" size={17} stroke={1.7} className="shrink-0 text-distant-graphite" />
      <input
        type="search"
        name="q"
        placeholder="Найти врача или специальность"
        autoComplete="off"
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[14.5px] text-graphite placeholder:text-distant-graphite focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-9 shrink-0 items-center gap-1 rounded-pill bg-clinic-teal px-4 text-[13.5px] font-medium tracking-[-0.005em] text-card-white transition-[background-color,transform] duration-150 hover:bg-brick-teal active:translate-y-px"
      >
        Найти
      </button>
    </form>
  );
}

interface HealthSnapshotProps {
  medical: MedicalRecord;
}

function HealthSnapshot({ medical }: HealthSnapshotProps) {
  const navigate = useNavigate();
  const bloodLine = [medical.bloodGroup, medical.rhFactor].filter(Boolean).join(" · ");

  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
          Что важно знать
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/history" })}
          className="text-[12.5px] font-medium text-clinic-teal hover:text-brick-teal"
        >
          Открыть медкарту →
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
        {bloodLine && <SnapshotRow label="Группа крови" value={bloodLine} />}
        <SnapshotRow
          label="Аллергии"
          value={stripDot(medical.allergies ?? "") || "Не указаны"}
          muted={!medical.allergies}
        />
        <SnapshotRow
          label="Препараты"
          value={stripDot(medical.currentMedications ?? "") || "Не указаны"}
          muted={!medical.currentMedications}
          last
        />
      </div>
    </section>
  );
}

interface SnapshotRowProps {
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}

function SnapshotRow({ label, value, muted, last }: SnapshotRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-3.5 py-3 text-[13px] ${
        last ? "" : "border-b border-hairline"
      }`}
    >
      <span className="shrink-0 pt-px text-distant-graphite">{label}</span>
      <span
        className={`max-w-[64%] text-right text-[13.5px] font-medium leading-snug ${
          muted ? "text-distant-graphite" : "text-graphite"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Recent visits ───────────────────────────────────────────────────────── */

interface RecentVisitsProps {
  visits: Appointment[];
  doctors: Doctor[];
}

function RecentVisits({ visits, doctors }: RecentVisitsProps) {
  const navigate = useNavigate();
  const rows = visits
    .map((v) => ({ visit: v, doctor: doctors.find((d) => d.id === v.doctorId) }))
    .filter((row): row is { visit: Appointment; doctor: Doctor } => Boolean(row.doctor));

  if (rows.length === 0) return null;

  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-distant-graphite">
          Прошлые визиты
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/visits", search: { tab: "past" } })}
          className="text-[12.5px] font-medium text-clinic-teal hover:text-brick-teal"
        >
          Все визиты →
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
        {rows.map(({ visit, doctor }, i) => (
          <VisitRow
            key={visit.id}
            visit={visit}
            doctor={doctor}
            last={i === rows.length - 1}
            onOpen={() => void navigate({ to: "/visits/$visitId", params: { visitId: visit.id } })}
          />
        ))}
      </div>
    </section>
  );
}

interface VisitRowProps {
  visit: Appointment;
  doctor: Doctor;
  last?: boolean;
  onOpen?: () => void;
}

function VisitRow({ visit, doctor, last, onOpen }: VisitRowProps) {
  const date = new Date(visit.date);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 border-0 bg-transparent px-3.5 py-3 text-left transition-colors hover:bg-graphite/[0.02] ${
        last ? "" : "border-b border-hairline"
      }`}
    >
      <Avatar initials={doctor.initials} color={doctor.color} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-tight tracking-[-0.005em] text-graphite">
          {visit.type}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] leading-tight text-distant-graphite">
          {RU_MONTH_DAY.format(date)} · {doctor.name} · {doctor.specialty}
        </p>
      </div>
      <Icon
        name="chevron-right"
        size={16}
        stroke={1.8}
        className="shrink-0 text-distant-graphite"
      />
    </button>
  );
}
