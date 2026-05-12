import type { APIRoute } from "astro";
import { DOCTOR_MOCKS } from "@/entities/doctor/mock/doctors.mock";
import { doctorSlug } from "../../lib/slug";

// SSR endpoint. Currently serves mocks; when the NestJS backend exposes
// /doctors/search this file becomes a thin proxy to it (or is removed if
// the marketing site hits the backend directly with CORS).
//
// Contract for any swap-in implementation:
//
//   GET /api/doctors.json
//     ?q=<free text against name/specialty/clinic>
//     &specialty=<exact match on doctor.specialty>
//     &sort=soon|near|experience      (default: soon)
//     &limit=<1..100>                 (default: 30)
//     &offset=<0..>                   (default: 0)
//
//   200 → { items: DoctorListItem[], total: number, limit: number, offset: number }
//
// `DoctorListItem` is the search-result projection — only the fields rendered
// on a list card. Detail-only fields (bio, education, reviews, languages,
// conditionsTreated, address, phone) live on /doctor/{slug}.

export const prerender = false;

type SortMode = "soon" | "near" | "experience";
const SORTS: readonly SortMode[] = ["soon", "near", "experience"];

interface DoctorListItem {
  id: string;
  slug: string;
  name: string;
  initials: string;
  color: string;
  specialty: string;
  subspecialty: string | null;
  clinic: string;
  rating: number | null;
  ratingCount: number | null;
  distance: string | null;
  yearsExperience: number | null;
  acceptingNewPatients: boolean | null;
  nextAvailable: string | null;
}

function project(d: (typeof DOCTOR_MOCKS)[number]): DoctorListItem {
  return {
    id: d.id,
    slug: doctorSlug(d),
    name: d.name,
    initials: d.initials,
    color: d.color,
    specialty: d.specialty,
    subspecialty: d.subspecialty ?? null,
    clinic: d.clinic,
    rating: d.rating ?? null,
    ratingCount: d.ratingCount ?? null,
    distance: d.distance ?? null,
    yearsExperience: d.yearsExperience ?? null,
    acceptingNewPatients: d.acceptingNewPatients ?? null,
    nextAvailable: d.nextAvailable ?? null,
  };
}

function parseKm(raw: string | null): number {
  if (!raw) return Number.POSITIVE_INFINITY;
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function nextAvailableMs(raw: string | null): number {
  if (!raw) return Number.POSITIVE_INFINITY;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const GET: APIRoute = ({ url }) => {
  const p = url.searchParams;

  const q = (p.get("q") ?? "").toLowerCase().trim();
  const specialty = p.get("specialty") ?? "";
  const sortRaw = p.get("sort") ?? "soon";
  const sort: SortMode = (SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as SortMode)
    : "soon";
  const limit = clamp(Number.parseInt(p.get("limit") ?? "30", 10) || 30, 1, 100);
  const offset = Math.max(0, Number.parseInt(p.get("offset") ?? "0", 10) || 0);

  // Filter
  const filtered = DOCTOR_MOCKS.filter((d) => {
    if (q && !`${d.name} ${d.specialty} ${d.clinic}`.toLowerCase().includes(q)) {
      return false;
    }
    if (specialty && d.specialty !== specialty) return false;
    return true;
  });

  // Sort
  const sorted = filtered.slice().sort((a, b) => {
    let delta = 0;
    if (sort === "soon") {
      delta = nextAvailableMs(a.nextAvailable ?? null) - nextAvailableMs(b.nextAvailable ?? null);
    } else if (sort === "near") {
      delta = parseKm(a.distance ?? null) - parseKm(b.distance ?? null);
    } else {
      delta = (b.yearsExperience ?? -1) - (a.yearsExperience ?? -1);
    }
    return delta !== 0 ? delta : a.name.localeCompare(b.name, "ru");
  });

  const total = sorted.length;
  const items = sorted.slice(offset, offset + limit).map(project);

  return new Response(JSON.stringify({ items, total, limit, offset }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Short browser cache + longer edge cache. Same URL = same answer
      // (deterministic given query). Tune when backend lands.
      "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
      vary: "Accept-Encoding",
    },
  });
};
