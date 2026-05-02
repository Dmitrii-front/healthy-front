import type { Doctor } from "@/entities/doctor";
import { Avatar } from "@/shared/ui/Avatar";

interface DoctorReminderProps {
  doctor: Doctor;
}

export function DoctorReminder({ doctor }: DoctorReminderProps) {
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-linen-shade px-3 py-2.5">
      <Avatar initials={doctor.initials} color={doctor.color} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-graphite">{doctor.name}</p>
        <p className="truncate text-[11.5px] text-distant-graphite">
          {doctor.specialty}
          {doctor.clinic && ` · ${doctor.clinic}`}
        </p>
      </div>
    </div>
  );
}
