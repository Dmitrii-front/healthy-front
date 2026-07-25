/**
 * Чистые функции без побочных эффектов и без обращений к сети.
 * Вынесены отдельно, чтобы покрыть тестами, как только в проекте появится раннер.
 */

/** Подложки аватара. Фото у врачей нет, поэтому инициалы всегда на цветном фоне. */
const AVATAR_COLORS = ['#E8D5C4', '#D8E3DC', '#E5DCEA', '#DCE5EE', '#EFE3D0', '#DDE7E3'] as const

/**
 * Детерминированный цвет по id: один и тот же врач всегда одного цвета,
 * а лента не выглядит монотонной.
 */
export function avatarColorFor(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export function buildInitials(lastName: string, firstName: string): string {
  const first = lastName.trim().charAt(0).toUpperCase()
  const second = firstName.trim().charAt(0).toUpperCase()
  const initials = `${first}${second}`
  return initials.length > 0 ? initials : '—'
}

export function buildShortName(lastName: string, firstName: string): string {
  return [lastName, firstName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export function buildFullName(
  lastName: string,
  firstName: string,
  middleName: string | null,
): string {
  return [lastName, firstName, middleName ?? '']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Специализация на бэке — свободный текст с разнобоем регистра
 * («стоматолог» против «Стоматолог»). Поднимаем первую букву, остальное не трогаем,
 * чтобы не сломать аббревиатуры.
 */
export function normalizeSpecialization(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/** Стаж из start_practise_date. Неполный год не засчитывается. */
export function yearsSince(isoDate: string | null): number | null {
  if (isoDate === null) return null
  const start = new Date(isoDate)
  if (Number.isNaN(start.getTime())) return null

  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  const monthDelta = now.getMonth() - start.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < start.getDate())) {
    years -= 1
  }
  return years >= 0 ? years : null
}

/**
 * Бэкенд хранит языки ISO-кодами (`["ru","ky","en"]`). Показывать пациенту
 * «ru, ky, en» нельзя — переводим в самоназвания, как принято в регионе.
 * Неизвестный код отдаём как есть в верхнем регистре, чтобы не потерять данные.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Русский',
  ky: 'Кыргызча',
  kk: 'Қазақша',
  uz: "O'zbekcha",
  en: 'English',
  tr: 'Türkçe',
}

export function formatLanguages(codes: string[]): string[] {
  return codes.map((code) => LANGUAGE_LABELS[code.toLowerCase()] ?? code.toUpperCase())
}

const priceFormatter = new Intl.NumberFormat('ru-RU')

/**
 * Валюты в API нет. Все врачи каталога — Кыргызстан, поэтому сом.
 * Когда бэкенд отдаст currency, менять только здесь.
 */
export function formatPriceKgs(value: number | null): string | null {
  if (value === null) return null
  return `${priceFormatter.format(value)} с`
}
