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

function sortOptions(options: FilterOption[]): FilterOption[] {
  return options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'))
}

export function buildSpecialtyOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  const groups = new Map<string, FilterOption>()

  for (const doctor of doctors) {
    const key = specialtyKeyOf(doctor.specialization)
    if (key === '') continue

    const seen = groups.get(key)
    if (seen) {
      seen.count += 1
    } else {
      groups.set(key, { key, label: doctor.specialization, count: 1 })
    }
  }

  return sortOptions([...groups.values()])
}

export function buildLanguageOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  const groups = new Map<string, FilterOption>()

  for (const doctor of doctors) {
    // Счётчик показывается рядом с опцией и означает врачей, а не строки:
    // бэкенд отдаёт список языков как есть и повторы в нём не исключены.
    for (const code of new Set(doctor.languageCodes)) {
      const seen = groups.get(code)
      if (seen) {
        seen.count += 1
      } else {
        groups.set(code, { key: code, label: formatLanguages([code])[0] ?? code, count: 1 })
      }
    }
  }

  return sortOptions([...groups.values()])
}
