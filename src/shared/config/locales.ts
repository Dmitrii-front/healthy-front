export const SUPPORTED_LOCALES = ['ru', 'en', 'kg'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

const STORAGE_KEY = 'healthy:locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const v = window.localStorage.getItem(STORAGE_KEY)
  return isLocale(v) ? v : DEFAULT_LOCALE
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, locale)
  window.document.documentElement.lang = locale
}
