import { useQuery } from "@tanstack/react-query";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { CareHero } from "@/widgets/care-hero";
import { HomeHeader } from "@/widgets/home-header";
import { RecommendedDoctors } from "@/widgets/recommended-doctors";
import { SearchLauncher } from "@/widgets/search-launcher";
import { SpecialtyGrid } from "@/widgets/specialty-grid";

export function HomePage() {
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list());

  return (
    <>
      <div className="pb-[120px]">
        <HomeHeader />

        <div className="px-4">
          <CareHero />
        </div>

        <div className="mt-7 px-4">
          <SpecialtyGrid />
        </div>

        <div className="mt-7 px-4">
          <RecommendedDoctors doctors={doctors.slice(0, 3)} />
        </div>
      </div>

      <SearchLauncher />
    </>
  );
}
