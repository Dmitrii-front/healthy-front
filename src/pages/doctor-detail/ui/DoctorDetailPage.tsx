import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";
import { Route } from "@/app/routes/doctor.$doctorId";
import { Stat } from "./Stat";
import { DetailGroup } from "./DetailGroup";
import { Pill } from "./Pill";
import { RatingStars } from "./RatingStars";
import { MapPlaceholder } from "./MapPlaceholder";
import { ContactRow } from "./ContactRow";
import { formatNextAvailable, pluralizeReviews, pluralizeYears } from "../lib/format";

type Tab = "about" | "reviews" | "office";

const TABS: { id: Tab; label: string }[] = [
  { id: "about", label: "О докторе" },
  { id: "reviews", label: "Отзывы" },
  { id: "office", label: "Клиника" },
];

const RATING_BREAKDOWN = [
  { label: "Подход", value: 4.9 },
  { label: "Ожидание", value: 4.6 },
  { label: "Слышит", value: 4.9 },
];

const OFFICE_HOURS: [string, string][] = [
  ["Пн – Чт", "8:00 – 17:00"],
  ["Пятница", "8:00 – 15:00"],
  ["Суббота", "9:00 – 12:00"],
  ["Воскресенье", "Закрыто"],
];

export function DoctorDetailPage() {
  const { doctorId } = Route.useParams();
  const router = useRouter();
  const { data: doctor, isPending } = useQuery(DOCTOR_QUERIES.detail(doctorId));
  const [tab, setTab] = useState<Tab>("about");

  const goBack = () => {
    // Prefer history.back; fall back to /search if there's no entry to pop.
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void router.navigate({ to: "/search" });
    }
  };

  if (isPending) {
    return <div className="px-5 pt-12 text-[14px] text-distant-graphite">Загрузка…</div>;
  }
  if (!doctor) {
    return (
      <div className="px-5 pt-12">
        <Link to="/search" className="text-[14px] font-medium text-brick-coral">
          ← Вернуться к поиску
        </Link>
        <p className="mt-4 text-[14px] text-distant-graphite">Доктор не найден.</p>
      </div>
    );
  }

  const reviews = doctor.reviews ?? [];
  const reviewCount = doctor.ratingCount ?? reviews.length;
  const acceptingNew = doctor.acceptingNewPatients ?? true;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-hairline bg-warm-paper/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          className="-ml-1 inline-flex items-center gap-0.5 px-1 py-1.5 text-[14.5px] font-medium text-brick-coral"
        >
          <Icon name="chevron-left" size={18} stroke={2} />
          Назад
        </button>
        <p className="truncate text-center text-[14.5px] font-medium text-graphite">
          {doctor.name.split(" ").slice(0, 2).join(" ")}
        </p>
        <button
          type="button"
          aria-label="В избранное"
          className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-card-white text-soft-graphite"
        >
          <Icon name="heart" size={15} stroke={1.7} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-[120px]">
        {/* Hero */}
        <section className="flex flex-col items-center gap-3 px-5 pt-6 pb-4">
          <Avatar initials={doctor.initials} color={doctor.color} size={84} />
          <div className="text-center">
            <h1 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.018em] text-graphite">
              {doctor.name}
            </h1>
            <p className="mt-1 text-[14px] text-soft-graphite">{doctor.specialty}</p>
            {doctor.subspecialty && (
              <p className="mt-px text-[12.5px] text-distant-graphite">{doctor.subspecialty}</p>
            )}
          </div>
          {acceptingNew ? (
            <Pill tone="success">
              <Icon name="check" size={11} stroke={2.5} />
              Принимаем новых пациентов
            </Pill>
          ) : (
            <Pill>Запись по предварительной договорённости</Pill>
          )}
        </section>

        {/* Stat strip */}
        <section className="px-4">
          <div className="grid grid-cols-3 overflow-hidden rounded-[14px] border border-hairline bg-card-white">
            <Stat
              label="Рейтинг"
              value={doctor.rating !== undefined ? doctor.rating.toFixed(1) : "—"}
              sub={reviewCount > 0 ? `${reviewCount} ${pluralizeReviews(reviewCount)}` : undefined}
            />
            <Stat
              label="Опыт"
              value={
                doctor.yearsExperience !== undefined
                  ? `${doctor.yearsExperience} ${pluralizeYears(doctor.yearsExperience)}`
                  : "—"
              }
              sub="практики"
              border
            />
            <Stat label="Расстояние" value={doctor.distance ?? "—"} sub="от вас" border />
          </div>
        </section>

        {/* Tabs */}
        <nav className="mt-6 flex border-b border-hairline px-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px flex-1 px-1 py-2.5 text-[13.5px] transition-colors ${
                  active
                    ? "border-b-2 border-graphite font-semibold text-graphite"
                    : "border-b-2 border-transparent text-distant-graphite"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Tab panes */}
        <section className="px-5 pt-4 pb-6">
          {tab === "about" && (
            <>
              {doctor.bio && (
                <p className="m-0 text-[14.5px] leading-[1.55] text-soft-graphite">{doctor.bio}</p>
              )}
              {doctor.education && (
                <DetailGroup label="Образование" mt={20}>
                  {doctor.education}
                </DetailGroup>
              )}
              {doctor.languages && doctor.languages.length > 0 && (
                <DetailGroup label="Языки">{doctor.languages.join(", ")}</DetailGroup>
              )}
              {doctor.conditionsTreated && doctor.conditionsTreated.length > 0 && (
                <DetailGroup label="Лечит">
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.conditionsTreated.map((c) => (
                      <Pill key={c}>{c}</Pill>
                    ))}
                  </div>
                </DetailGroup>
              )}
              {doctor.insurances && doctor.insurances.length > 0 && (
                <DetailGroup label="Страховки">
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.insurances.map((ins) => (
                      <Pill key={ins} tone="accent">
                        {ins}
                      </Pill>
                    ))}
                  </div>
                </DetailGroup>
              )}
            </>
          )}

          {tab === "reviews" && (
            <>
              <div className="flex items-center gap-4">
                <div>
                  <p className="m-0 text-[38px] font-medium leading-none tracking-[-0.012em] text-graphite tabular-nums">
                    {doctor.rating !== undefined ? doctor.rating.toFixed(1) : "—"}
                  </p>
                  <div className="mt-1.5">
                    <RatingStars rating={doctor.rating ?? 0} size={13} />
                  </div>
                  <p className="mt-1 text-[12px] text-distant-graphite">
                    {reviewCount} {pluralizeReviews(reviewCount)}
                  </p>
                </div>
                <div className="flex-1">
                  {RATING_BREAKDOWN.map((m) => (
                    <div key={m.label} className="mb-1.5 flex items-center gap-2">
                      <span className="w-[68px] text-[12px] text-soft-graphite">{m.label}</span>
                      <span className="relative h-[5px] flex-1 overflow-hidden rounded-pill bg-linen-shade">
                        <span
                          className="absolute inset-y-0 left-0 bg-brick-coral"
                          style={{ width: `${(m.value / 5) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-[11.5px] tabular-nums text-distant-graphite">
                        {m.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {reviews.length === 0 ? (
                  <p className="text-[13.5px] text-distant-graphite">
                    Пока нет письменных отзывов.
                  </p>
                ) : (
                  reviews.map((r, i) => (
                    <article
                      key={`${r.author}-${i}`}
                      className={`py-3.5 ${i < reviews.length - 1 ? "border-b border-hairline" : ""}`}
                    >
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <p className="text-[13.5px] font-medium text-graphite">{r.author}</p>
                        <p className="text-[11.5px] text-distant-graphite">{r.date}</p>
                      </div>
                      <RatingStars rating={r.rating} size={11} />
                      <p className="mt-1.5 text-[13.5px] leading-[1.5] text-soft-graphite">
                        {r.text}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </>
          )}

          {tab === "office" && (
            <>
              <DetailGroup label="Адрес" mt={0}>
                <p className="text-[14px] font-medium text-graphite">{doctor.clinic}</p>
                {doctor.address && (
                  <p className="mt-0.5 text-[13px] text-distant-graphite">{doctor.address}</p>
                )}
                <MapPlaceholder pinLabel={doctor.clinic} />
              </DetailGroup>
              <DetailGroup label="Часы работы">
                {OFFICE_HOURS.map(([d, t]) => (
                  <div
                    key={d}
                    className="flex justify-between py-1 text-[13.5px] text-soft-graphite"
                  >
                    <span>{d}</span>
                    <span className="text-distant-graphite tabular-nums">{t}</span>
                  </div>
                ))}
              </DetailGroup>
              <DetailGroup label="Контакты">
                <div className="flex flex-col gap-2">
                  {doctor.phone && <ContactRow icon="phone" label={doctor.phone} />}
                  {doctor.email && <ContactRow icon="mail" label={doctor.email} />}
                </div>
              </DetailGroup>
            </>
          )}
        </section>
      </div>

      {/* Sticky bottom book bar */}
      <div
        className="sticky bottom-0 flex items-center gap-3 border-t border-hairline bg-card-white px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
            Ближайшая запись
          </p>
          <p className="mt-0.5 truncate text-[13.5px] font-medium text-brick-coral tabular-nums">
            {doctor.nextAvailable
              ? formatNextAvailable(doctor.nextAvailable)
              : "Свяжитесь с клиникой"}
          </p>
        </div>
        <Link
          to="/booking/$doctorId"
          params={{ doctorId: doctor.id }}
          className="inline-flex h-[46px] shrink-0 items-center gap-2 rounded-pill bg-brick-coral px-6 text-[15px] font-medium text-card-white shadow-[0_6px_16px_color-mix(in_oklch,var(--color-brick-coral)_30%,transparent)]"
        >
          Записаться
          <Icon name="arrow-right" size={14} stroke={2} />
        </Link>
      </div>
    </div>
  );
}
