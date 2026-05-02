import { Link } from "@tanstack/react-router";
import type { Doctor } from "@/entities/doctor";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";
import { formatNextAvailable } from "../lib/format";

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <div className="rounded-[18px] border border-hairline bg-card-white p-3.5 transition-transform active:scale-[0.992]">
      <Link
        to="/doctor/$doctorId"
        params={{ doctorId: doctor.id }}
        className="flex w-full gap-3 text-left"
      >
        <Avatar initials={doctor.initials} color={doctor.color} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-medium leading-tight tracking-[-0.008em] text-graphite">
            {doctor.name}
          </p>
          <p className="mt-1 text-[13px] text-soft-graphite">{doctor.specialty}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-distant-graphite">
            {doctor.rating !== undefined && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Icon name="star" size={11} stroke={1.6} className="text-brick-coral" />
                {doctor.rating.toFixed(1)}
                {doctor.ratingCount !== undefined && ` (${doctor.ratingCount})`}
              </span>
            )}
            {doctor.distance && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Icon name="pin" size={11} stroke={1.6} />
                {doctor.distance}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-distant-graphite">
            Ближайшая запись
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-brick-coral tabular-nums">
            {doctor.nextAvailable
              ? formatNextAvailable(doctor.nextAvailable)
              : "Свяжитесь с клиникой"}
          </p>
        </div>
        <Link
          to="/booking/$doctorId"
          params={{ doctorId: doctor.id }}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-pill bg-graphite px-3.5 text-[13px] font-medium text-card-white"
        >
          Записаться
          <Icon name="arrow-right" size={13} stroke={2} />
        </Link>
      </div>
    </div>
  );
}
