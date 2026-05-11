import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCurrentUser, useSignOut } from "@/features/auth";
import { PATIENT_QUERIES } from "@/entities/patient";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { MEDICAL_RECORD_QUERIES } from "@/entities/medical-record";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";
import { ProfileSection } from "./ProfileSection";
import { InfoListGroup, InfoListRow } from "./InfoListGroup";
import { SettingsList, type SettingsItem } from "./SettingsList";
import { ageFromDob, formatDateLong, pluralizeYears } from "../lib/format";

export function ProfilePage() {
  const signOut = useSignOut();
  const [confirming, setConfirming] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: patient } = useQuery(PATIENT_QUERIES.current());
  const { data: medical } = useQuery(MEDICAL_RECORD_QUERIES.current());
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());

  const pcp = patient?.pcpId ? doctors.find((d) => d.id === patient.pcpId) : undefined;
  const age = patient ? ageFromDob(patient.dob) : null;

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const handleSignOut = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await signOut.mutateAsync();
    // The marketing landing lives at the browser root, outside the SPA's
    // /app basepath — use a full-page nav, not router.navigate.
    window.location.assign("/");
  };

  const settingsItems: SettingsItem[] = [
    { icon: "bell", label: "Уведомления", meta: "Вкл" },
    { icon: "lock", label: "Конфиденциальность" },
    { icon: "shield", label: "Данные о здоровье" },
    { icon: "info", label: "Помощь и поддержка" },
  ];

  if (!patient) {
    return <div className="px-5 pt-12 text-[14px] text-distant-graphite">Загрузка…</div>;
  }

  return (
    <div className="pb-[120px]">
      <header className="px-5 pt-12 pb-2">
        <h1 className="m-0 text-[26px] font-medium leading-[1.1] tracking-[-0.022em] text-graphite">
          Профиль
        </h1>
      </header>

      <div className="px-4 pt-4">
        {/* Identity card */}
        <div className="flex items-center gap-3.5 rounded-[22px] border border-hairline bg-card-white px-5 py-5">
          <Avatar
            initials={
              patient.initials ?? `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`
            }
            color="oklch(60% 0.05 200)"
            size={64}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-medium leading-[1.2] tracking-[-0.012em] text-graphite">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="mt-1 text-[13px] text-distant-graphite">
              {age !== null && `${age} ${pluralizeYears(age)}`}
              {patient.memberSinceYear && ` · Участник с ${patient.memberSinceYear}`}
            </p>
          </div>
          <button
            type="button"
            className="rounded-pill border border-hairline bg-transparent px-3 py-2 text-[12.5px] font-medium text-soft-graphite"
          >
            Изменить
          </button>
        </div>
      </div>

      <div className="px-4">
        <ProfileSection title="Личные данные">
          <InfoListGroup>
            <InfoListRow label="Дата рождения" value={formatDateLong(patient.dob)} />
            {medical?.phone && <InfoListRow label="Телефон" value={medical.phone} />}
            {(medical?.email || user?.email) && (
              <InfoListRow label="Email" value={medical?.email ?? user?.email ?? ""} />
            )}
            {medical?.address && <InfoListRow label="Адрес" value={medical.address} last />}
          </InfoListGroup>
        </ProfileSection>

        {pcp && (
          <ProfileSection title="Команда врачей">
            <Link
              to="/doctor/$doctorId"
              params={{ doctorId: pcp.id }}
              className="flex w-full items-center gap-3 rounded-[16px] border border-hairline bg-card-white p-3.5 text-left transition-transform active:scale-[0.992]"
            >
              <Avatar initials={pcp.initials} color={pcp.color} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-distant-graphite">
                  Семейный врач
                </p>
                <p className="mt-0.5 text-[14.5px] font-medium text-graphite">{pcp.name}</p>
                <p className="mt-px text-[12.5px] text-distant-graphite">{pcp.specialty}</p>
              </div>
              <Icon name="chevron-right" size={16} className="text-distant-graphite" />
            </Link>
          </ProfileSection>
        )}

        {(patient.insurance || patient.memberId) && (
          <ProfileSection title="Страхование">
            <InfoListGroup>
              {patient.insurance && (
                <InfoListRow label="Страховой план" value={patient.insurance} />
              )}
              {patient.memberId && (
                <InfoListRow label="Номер полиса" value={patient.memberId} last />
              )}
            </InfoListGroup>
          </ProfileSection>
        )}

        <ProfileSection title="Настройки">
          {medical && (
            <div className="mb-3">
              <InfoListGroup>
                <InfoListRow label="Язык" value={languageLabel(medical.preferredLanguage)} />
                <InfoListRow
                  label="Согласие на персональные данные"
                  value={consentLabel(medical.consentPersonalData)}
                />
                <InfoListRow
                  label="Согласие на медицинские данные"
                  value={consentLabel(medical.consentMedicalData)}
                  last
                />
              </InfoListGroup>
            </div>
          )}
          <SettingsList items={settingsItems} />
        </ProfileSection>

        <div className="pt-6">
          <button
            type="button"
            disabled={signOut.isPending}
            onClick={() => void handleSignOut()}
            className="w-full rounded-[14px] border border-hairline bg-transparent py-3.5 text-[14px] font-medium text-brick-coral transition-transform active:scale-[0.992] disabled:opacity-60"
          >
            {signOut.isPending ? "Выходим…" : confirming ? "Точно выйти? Нажмите ещё раз" : "Выйти"}
          </button>
        </div>
      </div>
    </div>
  );
}

function languageLabel(lang: "ru" | "en" | "kk" | null | undefined): string {
  if (lang === "ru") return "Русский";
  if (lang === "en") return "English";
  if (lang === "kk") return "Қазақша";
  return "—";
}

function consentLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Да" : "Нет";
}
