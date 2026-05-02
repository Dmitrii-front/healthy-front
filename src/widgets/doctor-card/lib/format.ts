const RU_MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июня",
  "июля",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];
const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

const dayMs = 24 * 60 * 60 * 1000;

/** "2026-05-12T09:30:00Z" → "Сегодня · 09:30" / "Завтра · 14:00" / "пн, 12 мая · 09:30" */
export function formatNextAvailable(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfDate - startOfToday) / dayMs);

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  if (diffDays === 0) return `Сегодня · ${time}`;
  if (diffDays === 1) return `Завтра · ${time}`;

  const wd = RU_WEEKDAYS_SHORT[date.getDay()] ?? "";
  const m = RU_MONTHS_SHORT[date.getMonth()] ?? "";
  return `${wd}, ${date.getDate()} ${m} · ${time}`;
}
