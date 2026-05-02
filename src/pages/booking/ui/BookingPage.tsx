import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { PATIENT_QUERIES } from "@/entities/patient";
import { generateAvailability, useBookingStore, isSameDay } from "@/features/booking";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Route } from "@/app/routes/booking.$doctorId";
import { DoctorReminder } from "./DoctorReminder";
import { StepDateTime } from "./StepDateTime";
import { StepDetails } from "./StepDetails";
import { StepReview } from "./StepReview";

const STEP_TITLES = ["Выбор времени", "Детали визита", "Подтверждение"] as const;

export function BookingPage() {
  const { doctorId } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const setLastConfirmed = useBookingStore((s) => s.setLastConfirmed);

  const { data: doctor } = useQuery(DOCTOR_QUERIES.detail(doctorId));
  const { data: patient } = useQuery(PATIENT_QUERIES.current());

  const availability = useMemo(() => generateAvailability(doctorId), [doctorId]);
  const firstDayWithSlots = availability.find((d) => d.slots.length > 0)?.date ?? null;

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(firstDayWithSlots);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState("Ежегодный осмотр");
  const [reason, setReason] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);

  if (!doctor || !patient) {
    return <div className="px-5 pt-12 text-[14px] text-distant-graphite">Загрузка…</div>;
  }

  const stepValid =
    step === 0
      ? selectedDay !== null && selectedTime !== null
      : step === 1
        ? Boolean(visitType)
        : true;

  const goBack = () => {
    if (step === 0) {
      if (router.history.canGoBack()) router.history.back();
      else void navigate({ to: "/doctor/$doctorId", params: { doctorId } });
    } else {
      setStep((s) => (s - 1) as 0 | 1);
    }
  };

  const handleNext = () => {
    if (step < 2) setStep((step + 1) as 1 | 2);
  };

  const handleConfirm = () => {
    if (!selectedDay || !selectedTime) return;
    const [hh, mm] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDay);
    dt.setHours(hh ?? 0, mm ?? 0, 0, 0);

    const id = `apt-${Math.random().toString(36).slice(2, 9)}`;
    setLastConfirmed({
      id,
      doctorId,
      dateTime: dt.toISOString(),
      time: selectedTime,
      day: selectedDay,
      type: visitType,
      reason,
      isNewPatient,
    });
    void navigate({ to: "/confirmation" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-hairline bg-warm-paper/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          aria-label="Назад"
          className="grid h-9 w-9 place-items-center rounded-full text-soft-graphite"
        >
          <Icon name="chevron-left" size={20} stroke={2} />
        </button>
        <p className="flex-1 text-center text-[14.5px] font-medium text-graphite">
          {STEP_TITLES[step]}{" "}
          <span className="text-distant-graphite tabular-nums">· {step + 1}/3</span>
        </p>
        <span className="h-9 w-9" />
      </header>

      {/* Progress */}
      <div className="flex gap-1 px-4 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i <= step ? "bg-graphite" : "bg-hairline"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <DoctorReminder doctor={doctor} />

        {step === 0 && (
          <StepDateTime
            availability={availability}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            onSelectDay={(iso) => {
              if (!isSameDay(iso, selectedDay ?? "")) setSelectedTime(null);
              setSelectedDay(iso);
            }}
            onSelectTime={setSelectedTime}
          />
        )}

        {step === 1 && (
          <StepDetails
            visitType={visitType}
            reason={reason}
            isNewPatient={isNewPatient}
            onVisitType={setVisitType}
            onReason={setReason}
            onIsNewPatient={setIsNewPatient}
          />
        )}

        {step === 2 && (
          <StepReview
            doctor={doctor}
            patientName={`${patient.firstName} ${patient.lastName}`}
            insurance={patient.insurance}
            day={selectedDay}
            time={selectedTime}
            visitType={visitType}
            reason={reason}
          />
        )}
      </div>

      <div
        className="sticky bottom-0 border-t border-hairline bg-card-white px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {step < 2 ? (
          <Button size="lg" full disabled={!stepValid} onClick={handleNext}>
            Далее
            <Icon name="arrow-right" size={14} stroke={2.2} />
          </Button>
        ) : (
          <Button size="lg" full onClick={handleConfirm}>
            <Icon name="check" size={14} stroke={2.4} />
            Подтвердить запись
          </Button>
        )}
      </div>
    </div>
  );
}
