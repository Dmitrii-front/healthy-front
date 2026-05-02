import { Link } from "@tanstack/react-router";
import type { Doctor } from "@/entities/doctor";
import { Avatar } from "@/shared/ui/Avatar";
import { Icon } from "@/shared/ui/Icon";

interface RecommendedDoctorsProps {
  doctors: Doctor[];
}

export function RecommendedDoctors({ doctors }: RecommendedDoctorsProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold tracking-tight text-graphite">Рекомендуем</h2>
        <Link to="/search" className="text-[13px] font-medium text-brick-coral">
          Все
        </Link>
      </div>
      <ul className="flex flex-col">
        {doctors.map((doc, i) => (
          <li key={doc.id}>
            <Link
              to="/doctor/$doctorId"
              params={{ doctorId: doc.id }}
              className={`flex w-full items-center gap-3 py-3 text-left transition-transform active:scale-[0.99] ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <Avatar initials={doc.initials} color={doc.color} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium tracking-[-0.005em] text-graphite">
                  {doc.name}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-distant-graphite">
                  {doc.specialty}
                  {doc.distance && ` · ${doc.distance}`}
                  {doc.rating && ` · ★ ${doc.rating.toFixed(1)}`}
                </p>
              </div>
              <Icon
                name="chevron-right"
                size={18}
                stroke={1.8}
                className="shrink-0 text-distant-graphite"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
