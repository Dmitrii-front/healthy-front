/**
 * Русское склонение по числу. Формы задаются тройкой:
 * [для 1, для 2-4, для 5-0 и второго десятка].
 */
export function pluralizeRu(n: number, forms: readonly [string, string, string]): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return forms[2]
  if (m10 === 1) return forms[0]
  if (m10 >= 2 && m10 <= 4) return forms[1]
  return forms[2]
}

const DOCTOR_FORMS: readonly [string, string, string] = ['врач', 'врача', 'врачей']

/** Форма слова «врач» для счётчика найденного. */
export function pluralizeDoctors(n: number): string {
  return pluralizeRu(n, DOCTOR_FORMS)
}
