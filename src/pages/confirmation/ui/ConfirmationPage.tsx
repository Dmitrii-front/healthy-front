import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { PATIENT_QUERIES } from "@/entities/patient";
import { useBookingStore, formatDateLong } from "@/features/booking";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { ConfirmLine } from "./ConfirmLine";

export function ConfirmationPage() {
  const navigate = useNavigate();
  const booking = useBookingStore((s) => s.lastConfirmed);
  const clear = useBookingStore((s) => s.clear);

  const { data: doctor } = useQuery({
    ...DOCTOR_QUERIES.detail(booking?.doctorId ?? ""),
    enabled: Boolean(booking?.doctorId),
  });
  const { data: patient } = useQuery(PATIENT_QUERIES.current());

  // If a user lands on /confirmation directly without a booking, bounce home.
  useEffect(() => {
    if (!booking) void navigate({ to: "/" });
  }, [booking, navigate]);

  if (!booking || !doctor) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-12">
      <div className="mx-auto mt-8 mb-4 grid h-16 w-16 place-items-center rounded-full bg-tinted-linen text-brick-coral">
        <Icon name="check" size={28} stroke={2.4} />
      </div>
      <h1 className="m-0 text-center text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-graphite">
        Всё готово{patient?.firstName ? `, ${patient.firstName}` : ""}.
      </h1>
      <p className="mx-4 mt-2.5 mb-6 text-center text-[14.5px] leading-[1.5] text-distant-graphite">
        Подтверждение отправлено на вашу почту. Напомним за 24 часа до визита.
      </p>

      <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
        <div className="flex items-center gap-3 border-b border-hairline p-4">
          <Avatar initials={doctor.initials} color={doctor.color} size={40} />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-medium text-graphite">{doctor.name}</p>
            <p className="mt-px truncate text-[12px] text-distant-graphite">{doctor.specialty}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 p-4">
          <ConfirmLine icon="calendar" label={formatDateLong(booking.dateTime)} />
          <ConfirmLine icon="clock" label={`${booking.time} · ${booking.type}`} />
          {doctor.address && (
            <ConfirmLine icon="pin" label={`${doctor.clinic} · ${doctor.address}`} />
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" full>
          <Icon name="calendar" size={14} stroke={1.8} />
          В календарь
        </Button>
        <Link
          to="/visits"
          search={{ tab: "upcoming" }}
          onClick={() => clear()}
          className="inline-flex h-[46px] flex-1 items-center justify-center gap-3.5 rounded-pill bg-brick-coral px-7 text-[15px] font-medium text-card-white shadow-[0_6px_16px_color-mix(in_oklch,var(--color-brick-coral)_30%,transparent)]"
        >
          Мои визиты
          <Icon name="arrow-right" size={14} stroke={2} />
        </Link>
      </div>

      <Link
        to="/"
        onClick={() => clear()}
        className="mt-4 self-center bg-transparent py-3.5 text-center text-[13.5px] text-distant-graphite"
      >
        На главную
      </Link>
    </div>
  );
}
