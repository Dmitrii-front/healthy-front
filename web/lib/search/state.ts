/**
 * Состояние выдачи. Ровно три фильтра — остальные параметры, которые страница
 * читала раньше (sort, rating, exp, accepting, format, city), не влияли на
 * результат и удалены.
 *
 * В адресной строке лежат стабильные значения: ключ специальности в нижнем
 * регистре и ISO-код языка, а не подписи. Подписи меняются вместе с данными и
 * оформлением, а ссылки должны это переживать.
 */
export interface SearchState {
  q: string
  specialty: string
  lang: string
}

export interface SearchChip {
  key: keyof SearchState
  label: string
}

export const EMPTY_SEARCH_STATE: SearchState = { q: '', specialty: '', lang: '' }

/** Разбирает строку параметров (`location.search` или её кусок). */
export function readSearchState(search: string): SearchState {
  const params = new URLSearchParams(search)
  return {
    q: (params.get('q') ?? '').trim(),
    specialty: (params.get('specialty') ?? '').trim().toLowerCase(),
    lang: (params.get('lang') ?? '').trim().toLowerCase(),
  }
}

/** Собирает строку параметров, опуская пустые значения. */
export function buildSearchQuery(state: SearchState): string {
  const params = new URLSearchParams()
  if (state.q) params.set('q', state.q)
  if (state.specialty) params.set('specialty', state.specialty)
  if (state.lang) params.set('lang', state.lang)
  return params.toString()
}

/**
 * Активные фильтры для строки снимаемых чипов.
 *
 * Подписи приходят словарями снаружи: их строит сборка из фактического
 * каталога, и клиент не должен уметь выводить подпись из ключа. Если подписи
 * нет — показываем сырое значение, иначе чип станет неснимаемым.
 */
export function activeChips(
  state: SearchState,
  specialtyLabels: Record<string, string>,
  languageLabels: Record<string, string>,
): SearchChip[] {
  const chips: SearchChip[] = []
  if (state.q) chips.push({ key: 'q', label: `«${state.q}»` })
  if (state.specialty) {
    chips.push({ key: 'specialty', label: specialtyLabels[state.specialty] ?? state.specialty })
  }
  if (state.lang) {
    chips.push({ key: 'lang', label: languageLabels[state.lang] ?? state.lang })
  }
  return chips
}
