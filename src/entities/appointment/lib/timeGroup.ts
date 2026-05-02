const RU_MONTHS_GENITIVE = [
  "январе",
  "феврале",
  "марте",
  "апреле",
  "мае",
  "июне",
  "июле",
  "августе",
  "сентябре",
  "октябре",
  "ноябре",
  "декабре",
] as const;

export function getTimeGroup(date: Date | string, today: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - t.getTime()) / 86_400_000);

  if (days === 0) return "СЕГОДНЯ";
  if (days === 1) return "ЗАВТРА";
  if (days >= 2 && days <= 7) return "НА ЭТОЙ НЕДЕЛЕ";
  if (days >= 8 && days <= 14) return "НА БУДУЩЕЙ НЕДЕЛЕ";

  const sameMonth = d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  if (sameMonth) return "В ЭТОМ МЕСЯЦЕ";
  return `В ${RU_MONTHS_GENITIVE[d.getMonth()]!.toUpperCase()}`;
}
