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
  avatarUrl: string | null
  specialty: string
  specialtyKey: string
  subspecializations: string[]
  city: string | null
  languages: string[]
  languageCodes: string[]
  priceFrom: number | null
  yearsExperience: number | null
  workplaces: { name: string; address: string }[]
  workplacesTotal: number
}

export interface FilterOption {
  key: string
  label: string
  count: number
}

/** Карточка показывает два места приёма, остальные сворачиваются в «+N». */
export const SEARCH_INDEX_MAX_WORKPLACES = 2

export function specialtyKeyOf(specialty: string): string {
  return specialty.trim().toLowerCase()
}

export function toSearchIndexItem(doctor: DoctorProfileView, slug: string): SearchIndexItem {
  return {
    slug,
    fullName: doctor.fullName,
    initials: doctor.initials,
    avatarColor: doctor.avatarColor,
    avatarUrl: doctor.avatarUrl,
    specialty: doctor.specialization,
    specialtyKey: specialtyKeyOf(doctor.specialization),
    subspecializations: doctor.subspecializations,
    city: doctor.city,
    languages: doctor.languages,
    languageCodes: doctor.languageCodes,
    priceFrom: doctor.priceFrom,
    yearsExperience: doctor.yearsExperience,
    workplaces: doctor.workplaces
      .slice(0, SEARCH_INDEX_MAX_WORKPLACES)
      .map((workplace) => ({ name: workplace.name, address: workplace.address })),
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
      // Написание уже нормализовано в toDoctorListItem, внутри группы оно одно
      // на всех — поэтому подписью служит первое встреченное, без выбора частот.
      groups.set(key, { key, label: doctor.specialization, count: 1 })
    }
  }

  return sortOptions([...groups.values()])
}

export function buildLanguageOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  const groups = new Map<string, FilterOption>()

  for (const doctor of doctors) {
    for (const code of doctor.languageCodes) {
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
