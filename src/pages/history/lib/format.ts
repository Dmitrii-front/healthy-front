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

/** "1989-03-22" → "22 марта 1989 · 37 лет" (age computed against today). */
export function formatDob(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  const monthName = RU_MONTHS_FULL[m - 1] ?? "";
  const yearLabel = pluralize(age, ["год", "года", "лет"]);
  return `${d} ${monthName} ${y} · ${age} ${yearLabel}`;
}

export function genderLabel(g: "female" | "male" | "other"): string {
  if (g === "female") return "Женский";
  if (g === "male") return "Мужской";
  return "Другой";
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}
