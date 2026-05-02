export interface DaySlots {
  /** ISO datetime at 00:00 of the day. */
  date: string;
  /** "HH:MM" 24h slot strings. */
  slots: string[];
}

const SLOT_POOL = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

/**
 * Deterministic 14-day availability for a doctor. Sundays are closed; other
 * days get a pseudo-random subset of slots seeded off the doctor id.
 */
export function generateAvailability(doctorId: string, startDate?: Date): DaySlots[] {
  const seed = doctorId.charCodeAt(0) || 1;
  const start = startDate ?? new Date();
  const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfDay);
    d.setDate(startOfDay.getDate() + i);
    const iso = d.toISOString();
    if (d.getDay() === 0) return { date: iso, slots: [] };
    const noise = (seed + i * 13) % 17;
    return {
      date: iso,
      slots: SLOT_POOL.filter((_, idx) => (idx + noise) % 3 !== 0).slice(0, 8 - (i % 4)),
    };
  });
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const x = typeof a === "string" ? new Date(a) : a;
  const y = typeof b === "string" ? new Date(b) : b;
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}
