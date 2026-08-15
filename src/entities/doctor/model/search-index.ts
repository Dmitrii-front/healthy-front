import { formatLanguages } from '../lib/doctor-display'
import type { DoctorProfileView } from './doctor-view'

/**
 * Запись каталога, инлайнящаяся в HTML выдачи. Намеренно уже профиля: всё,
 * что нужно только странице врача, сюда не попадает — индекс уезжает
 * пользователю целиком и платится его весом.
 */
export interface SearchIndexItem {
  slug: string
  fullName: string
  initials: string
  avatarColor: string
  specialty: string
  specialtyKey: string
  subspecializations: string[]
  city: string | null
  languages: string[]
  languageCodes: string[]
  priceFrom: number | null
  yearsExperience: number | null
  workplaceName: string | null
  workplacesTotal: number
}

/**
 * Та же запись, но без подписей, которые страница уже везёт словарями
 * `specialtyLabels` / `languageLabels`: подпись специальности выводится из
 * `specialtyKey`, подписи языков — из `languageCodes`. На каталоге в несколько
 * сотен врачей это единственные поля, которые дублировались построчно, а
 * островок уезжает в HTML каждой выдачи целиком.
 */
export type SearchIndexWire = Omit<SearchIndexItem, 'specialty' | 'languages'>

export interface FilterOption {
  key: string
  label: string
  count: number
}

export function specialtyKeyOf(specialty: string): string {
  return specialty.trim().toLowerCase()
}

export function toSearchIndexItem(doctor: DoctorProfileView, slug: string): SearchIndexItem {
  return {
    slug,
    fullName: doctor.fullName,
    initials: doctor.initials,
    avatarColor: doctor.avatarColor,
    specialty: doctor.specialization,
    specialtyKey: specialtyKeyOf(doctor.specialization),
    subspecializations: doctor.subspecializations,
    city: doctor.city,
    languages: doctor.languages,
    languageCodes: doctor.languageCodes,
    priceFrom: doctor.priceFrom,
    yearsExperience: doctor.yearsExperience,
    workplaceName: doctor.workplaces[0]?.name ?? null,
    workplacesTotal: doctor.workplaces.length,
  }
}

export function toSearchIndexWire(item: SearchIndexItem): SearchIndexWire {
  // Через rest, а не перечислением полей: новое поле индекса иначе тихо
  // потерялось бы по дороге к клиенту.
  const { specialty: _specialty, languages: _languages, ...wire } = item
  return wire
}

/**
 * Обратная сборка на клиенте. Подписи берутся из тех же словарей, которыми
 * подписаны фильтры, — так карточка и фильтр не могут разойтись в словах.
 * Ключ без подписи показывается как есть: пустая карточка хуже сырого ключа.
 */
export function fromSearchIndexWire(
  wire: SearchIndexWire,
  specialtyLabels: Record<string, string>,
  languageLabels: Record<string, string>,
): SearchIndexItem {
  return {
    ...wire,
    specialty: specialtyLabels[wire.specialtyKey] ?? wire.specialtyKey,
    languages: wire.languageCodes.map((code) => languageLabels[code] ?? code),
  }
}

/**
 * Общая сборка опций фильтра: врач добавляет по единице каждому своему ключу,
 * пустые ключи не заводят опцию, порядок — по частоте, при равенстве по алфавиту.
 *
 * `keysOf` отдаёт ключи одного врача уже без повторов: счётчик означает врачей,
 * а не строки данных, — бэкенд отдаёт списки как есть, и повторы в них возможны.
 */
function buildOptions(
  doctors: readonly DoctorProfileView[],
  keysOf: (doctor: DoctorProfileView) => Iterable<string>,
  labelOf: (key: string, doctor: DoctorProfileView) => string,
): FilterOption[] {
  const groups = new Map<string, FilterOption>()

  for (const doctor of doctors) {
    for (const key of keysOf(doctor)) {
      if (key === '') continue

      const seen = groups.get(key)
      if (seen) {
        seen.count += 1
      } else {
        groups.set(key, { key, label: labelOf(key, doctor), count: 1 })
      }
    }
  }

  return [...groups.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'),
  )
}

export function buildSpecialtyOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  return buildOptions(
    doctors,
    (doctor) => [specialtyKeyOf(doctor.specialization)],
    (_key, doctor) => doctor.specialization,
  )
}

export function buildLanguageOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  return buildOptions(
    doctors,
    (doctor) => new Set(doctor.languageCodes),
    (key) => formatLanguages([key])[0] ?? key,
  )
}
