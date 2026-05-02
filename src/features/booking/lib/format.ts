const RU_MONTHS_FULL = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

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

/** "2026-05-12T09:30:00Z" → "12 мая 2026, 09:30". */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  const month = RU_MONTHS_FULL[d.getMonth()] ?? "";
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} ${month} ${d.getFullYear()}, ${time}`;
}

/** "2026-05-12T..." → "пн, 12 мая". */
export function formatDayShort(iso: string): string {
  const d = new Date(iso);
  const wd = RU_WEEKDAYS_SHORT[d.getDay()] ?? "";
  const m = RU_MONTHS_SHORT[d.getMonth()] ?? "";
  return `${wd}, ${d.getDate()} ${m}`;
}

/** "пн, 12 мая · 09:30". */
export function formatDayShortWithTime(iso: string, time: string): string {
  return `${formatDayShort(iso)} · ${time}`;
}

export function weekdayShort(iso: string): string {
  return RU_WEEKDAYS_SHORT[new Date(iso).getDay()] ?? "";
}
