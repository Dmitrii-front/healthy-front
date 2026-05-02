import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Appointment } from "@/entities/appointment";
import { APPOINTMENT_QUERIES, getTimeGroup } from "@/entities/appointment";
import type { Doctor } from "@/entities/doctor";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { cn } from "@/shared/lib/cn";
import { VisitCard } from "@/widgets/visit-card";

type DocById = (id: string) => Doctor | undefined;

interface EyebrowRow {
  type: "eyebrow";
  key: string;
  label: string;
  first: boolean;
}
interface CardRow {
  type: "card";
  key: string;
  apt: Appointment;
  isLastInGroup: boolean;
  isPrimary: boolean;
}
type Row = EyebrowRow | CardRow;

export function VisitsPage() {
  const { tab } = useSearch({ from: "/visits" });
  const navigate = useNavigate();
  const { data: appointments = [] } = useQuery(APPOINTMENT_QUERIES.list());
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());
  const docById = (id: string) => doctors.find((d) => d.id === id);

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => new Date(a.date).getTime() >= now && a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = appointments
    .filter((a) => new Date(a.date).getTime() < now)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section>
      <header className="px-5 pt-3 pb-3">
        <div className="mb-3.5 flex items-center justify-between">
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.022em] text-graphite font-display">
            Визиты
          </h1>
          <button
            type="button"
            aria-label="Записаться"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-card-white text-soft-graphite shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          >
            <PlusIcon />
          </button>
        </div>

        <div
          role="tablist"
          className="flex gap-1 rounded-[10px] bg-linen-shade p-[3px] text-[13px]"
        >
          <SegBtn
            active={tab === "upcoming"}
            onClick={() => void navigate({ to: "/visits", search: { tab: "upcoming" } })}
          >
            Предстоящие · {upcoming.length}
          </SegBtn>
          <SegBtn
            active={tab === "past"}
            onClick={() => void navigate({ to: "/visits", search: { tab: "past" } })}
          >
            Прошедшие · {past.length}
          </SegBtn>
        </div>
      </header>

      <div
        className="pb-6"
        style={{
          paddingLeft: "clamp(16px, 5vw, 22px)",
          paddingRight: "clamp(16px, 5vw, 22px)",
        }}
      >
        {tab === "upcoming" ? (
          <UpcomingList appointments={upcoming} docById={docById} />
        ) : (
          <PastList appointments={past} docById={docById} />
        )}
      </div>
    </section>
  );
}

function UpcomingList({
  appointments,
  docById,
}: {
  appointments: Appointment[];
  docById: DocById;
}) {
  const rows = buildRows(appointments);
  if (rows.length === 0) {
    return (
      <div className="flex flex-col">
        <EmptyState message="У вас пока нет предстоящих визитов." />
        <GhostBookCard />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {rows.map((row) =>
        row.type === "eyebrow" ? (
          <EyebrowRule key={row.key} label={row.label} first={row.first} />
        ) : (
          <div key={row.key} style={{ marginBottom: row.isLastInGroup ? 0 : 12 }}>
            {(() => {
              const doc = docById(row.apt.doctorId);
              if (!doc) return null;
              return <VisitCard appointment={row.apt} doctor={doc} primary={row.isPrimary} />;
            })()}
          </div>
        ),
      )}
      <GhostBookCard />
    </div>
  );
}

function PastList({ appointments, docById }: { appointments: Appointment[]; docById: DocById }) {
  if (appointments.length === 0) {
    return <EmptyState message="История визитов пуста." />;
  }
  return (
    <div className="flex flex-col gap-2.5 pt-2">
      {appointments.map((apt) => {
        const doc = docById(apt.doctorId);
        if (!doc) return null;
        return <VisitCard key={apt.id} appointment={apt} doctor={doc} past />;
      })}
    </div>
  );
}

function buildRows(sorted: Appointment[]): Row[] {
  const rows: Row[] = [];
  let prevGroup: string | null = null;
  let firstCard = true;
  sorted.forEach((apt, i) => {
    const group = getTimeGroup(new Date(apt.date));
    if (group !== prevGroup) {
      rows.push({ type: "eyebrow", label: group, first: firstCard, key: `eyebrow-${i}` });
      prevGroup = group;
      firstCard = false;
    }
    const next = sorted[i + 1];
    const nextGroup = next ? getTimeGroup(new Date(next.date)) : null;
    rows.push({
      type: "card",
      apt,
      isLastInGroup: nextGroup !== group,
      isPrimary: i === 0,
      key: apt.id,
    });
  });
  return rows;
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[7px] border-0 px-2.5 py-[7px] text-[13px] transition-[background,box-shadow] duration-150",
        active
          ? "bg-card-white font-medium text-graphite shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "bg-transparent text-distant-graphite",
      )}
    >
      {children}
    </button>
  );
}

function EyebrowRule({ label, first }: { label: string; first: boolean }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ marginTop: first ? 8 : 20, marginBottom: 12 }}
    >
      <span aria-hidden className="h-px flex-1 bg-graphite/8" />
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-distant-graphite">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-graphite/8" />
    </div>
  );
}

function GhostBookCard() {
  return (
    <button
      type="button"
      className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-graphite/15 bg-transparent px-4 py-3 text-[14px] font-medium text-distant-graphite transition-[background,border-color,color] duration-150 hover:border-graphite/25 hover:bg-graphite/[0.02] hover:text-soft-graphite"
    >
      <span className="text-[14px] font-normal leading-none">+</span>
      <span>Записаться на новый визит</span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-2 py-12 text-center text-[13.5px] text-distant-graphite">{message}</p>;
}

function PlusIcon() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
