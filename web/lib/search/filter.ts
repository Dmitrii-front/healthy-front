import type { SearchState } from './state'

/**
 * Поля, по которым идёт фильтрация. Намеренно уже, чем карточка: функции
 * незачем знать про аватары, цены и места приёма.
 */
export interface SearchableDoctor {
  fullName: string
  specialty: string
  specialtyKey: string
  subspecializations: string[]
  languageCodes: string[]
}

/**
 * Отбирает врачей по состоянию фильтров. Порядок входного списка сохраняется:
 * сортировок у выдачи нет, каталог приходит в том порядке, в котором его отдал
 * бэкенд.
 *
 * Строка ищется по ФИО, специальности и суб-специализациям. По названиям мест
 * приёма поиск сознательно не ведётся.
 */
export function filterDoctors<T extends SearchableDoctor>(
  items: readonly T[],
  state: SearchState,
): T[] {
  const q = state.q.trim().toLowerCase()

  return items.filter((doctor) => {
    if (state.specialty && doctor.specialtyKey !== state.specialty) return false
    if (state.lang && !doctor.languageCodes.includes(state.lang)) return false

    if (q) {
      const haystack = [doctor.fullName, doctor.specialty, ...doctor.subspecializations]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}
