import type { Doctor } from "@/entities/doctor";

export interface SearchFilters {
  query: string;
  /** "all" or a canonical specialty string from Doctor.specialty. */
  specialty: string;
}

export function filterDoctors(doctors: Doctor[], filters: SearchFilters): Doctor[] {
  const q = filters.query.trim().toLowerCase();
  return doctors.filter((d) => {
    if (q && !`${d.name} ${d.specialty} ${d.clinic}`.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.specialty !== "all" && d.specialty !== filters.specialty) {
      return false;
    }
    return true;
  });
}

/** Build a unique sorted list of specialties present in the doctor mock. */
export function uniqueSpecialties(doctors: Doctor[]): string[] {
  return Array.from(new Set(doctors.map((d) => d.specialty))).sort();
}
