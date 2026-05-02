import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { Chip } from "@/shared/ui/Chip";
import { Icon } from "@/shared/ui/Icon";
import { SearchInput } from "@/shared/ui/SearchInput";
import { DoctorCard } from "@/widgets/doctor-card";
import { Route } from "@/app/routes/search";
import { filterDoctors, uniqueSpecialties } from "../lib/filter";
import { FilterSheet } from "./FilterSheet";

export function SearchPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());

  const [query, setQuery] = useState(search.q ?? "");
  const [filterOpen, setFilterOpen] = useState(false);

  const specialty = search.specialty ?? "all";

  const setSpecialty = (next: string) => {
    void navigate({
      to: "/search",
      search: (prev) => ({ ...prev, specialty: next === "all" ? undefined : next }),
      replace: true,
    });
  };

  const allSpecialties = useMemo(() => uniqueSpecialties(doctors), [doctors]);
  const filtered = useMemo(
    () => filterDoctors(doctors, { query, specialty }),
    [doctors, query, specialty],
  );

  // Top chip strip: keep "All" + first 5 specialties; if active specialty isn't
  // already visible, swap it into position 2.
  const topChips = useMemo(() => {
    const head = allSpecialties.slice(0, 5);
    if (specialty !== "all" && !head.includes(specialty)) {
      return [specialty, ...head.slice(0, 4)];
    }
    return head;
  }, [allSpecialties, specialty]);

  return (
    <div className="pb-[120px]">
      <header className="bg-warm-paper px-4 pt-9 pb-3">
        <Link
          to="/"
          className="-ml-1 mb-1 inline-flex items-center gap-0.5 px-1 py-1.5 text-[14.5px] font-medium text-brick-coral"
        >
          <Icon name="chevron-left" size={18} stroke={2} />
          Назад
        </Link>
        <h1 className="m-0 mb-3 px-1 text-[26px] font-medium leading-[1.1] tracking-[-0.022em] text-graphite">
          Найти доктора
        </h1>
        <SearchInput value={query} onChange={setQuery} placeholder="Имя, специальность, клиника" />
        <div
          className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <Chip active={filterOpen} icon="filter" onClick={() => setFilterOpen(true)}>
            Фильтры
          </Chip>
          <Chip active={specialty === "all"} onClick={() => setSpecialty("all")}>
            Все
          </Chip>
          {topChips.map((s) => (
            <Chip key={s} active={specialty === s} onClick={() => setSpecialty(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </header>

      <div className="px-4 pt-2">
        <p className="mb-3 px-1 text-[12.5px] text-distant-graphite">
          <span className="font-medium text-soft-graphite">{filtered.length} </span>
          {pluralizeProviders(filtered.length)} · в радиусе 10 км
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-start rounded-[18px] border border-dashed border-hairline-strong bg-card-white px-5 py-7">
            <p className="text-[15px] font-medium text-graphite">Пока никого не нашли.</p>
            <p className="mt-1 text-[13px] text-distant-graphite">
              Попробуйте сбросить фильтры или изменить запрос.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        specialties={allSpecialties}
        selectedSpecialty={specialty}
        onSelectSpecialty={setSpecialty}
        resultCount={filtered.length}
        onReset={() => {
          setQuery("");
          setSpecialty("all");
        }}
      />
    </div>
  );
}

function pluralizeProviders(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "докторов";
  if (mod10 === 1) return "доктор";
  if (mod10 >= 2 && mod10 <= 4) return "доктора";
  return "докторов";
}
