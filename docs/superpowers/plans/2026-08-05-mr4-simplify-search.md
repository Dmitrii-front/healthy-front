# MR 4: Упрощение поиска и вынос логики в тестируемые модули — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать из поиска всё, под чем в бэкенде нет данных, и вынести оставшуюся чистую логику в модули под тестами.

**Architecture:** Три фильтра вместо семи, ноль сортировок, ни шторки, ни среза выдачи. Разбор адресной строки, фильтрация и склонения переезжают в `web/lib/search/*` — теперь это возможно, потому что после MR 3 скрипт бандлится и умеет импортировать. Страница по-прежнему работает на моках: подключение реального каталога — следующий MR.

**Tech Stack:** Astro 7, Vitest 4, TypeScript 6 strict.

**Спека:** `docs/superpowers/specs/2026-08-05-doctors-search-astro-design.md`, раздел 6 и часть раздела 7.

**Зависит от:** MR 1 (раннер), MR 3 (бандлящийся скрипт — без него импорт в логику невозможен).

---

## Что и почему удаляется

| Удаляем                                                          | Причина                                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Сортировки «скоро / ближе / опытнее»                             | Нужны ближайший слот, координаты и стаж — в выдаче поиска бэкенда нет ни одного из трёх             |
| Фильтры «рейтинг», «стаж», «принимает новых»                     | `rating` и `reviews_count` пусты у всех врачей; признака «принимает новых» в API нет                |
| Фильтр «формат приёма»                                           | `consultation_formats` пуст у всех семи врачей — фильтр обнулил бы выдачу                           |
| Параметры `sort`, `rating`, `exp`, `accepting`, `format`, `city` | Ни один не влияет на выдачу; `format` и `city` вдобавок рисуют чипы, которые ничего не делают       |
| Срез выдачи в 30 карточек                                        | Счётчик показывает полное число, список — тридцать; при каталоге больше тридцати остаток недостижим |
| Декоративная пагинация                                           | Три кнопки без обработчиков                                                                         |
| Шторка «Все фильтры»                                             | Оставшиеся три контрола помещаются в строку поиска                                                  |

---

## File Structure

| Файл                                      | Ответственность                                                  |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `web/lib/search/format.ts` (создать)      | Русские склонения для счётчика результатов                       |
| `web/lib/search/format.test.ts` (создать) | Тесты склонений                                                  |
| `web/lib/search/state.ts` (создать)       | Разбор и сборка адресной строки, список активных чипов           |
| `web/lib/search/state.test.ts` (создать)  | Тесты состояния                                                  |
| `web/lib/search/filter.ts` (создать)      | Фильтрация списка врачей по состоянию                            |
| `web/lib/search/filter.test.ts` (создать) | Тесты фильтрации                                                 |
| `web/pages/search.astro` (изменить)       | Удаление сортировок, шторки, пагинации, среза; переход на модули |

---

## Task 1: Склонения для счётчика результатов

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/web/lib/search/format.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/search/format.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { pluralizeRu, pluralizeDoctors } from './format'

describe('pluralizeRu', () => {
  const forms: [string, string, string] = ['врач', 'врача', 'врачей']

  it('склоняет единицу', () => {
    expect(pluralizeRu(1, forms)).toBe('врач')
    expect(pluralizeRu(21, forms)).toBe('врач')
    expect(pluralizeRu(101, forms)).toBe('врач')
  })

  it('склоняет от двух до четырёх', () => {
    expect(pluralizeRu(2, forms)).toBe('врача')
    expect(pluralizeRu(4, forms)).toBe('врача')
    expect(pluralizeRu(22, forms)).toBe('врача')
  })

  it('склоняет пять и больше', () => {
    expect(pluralizeRu(5, forms)).toBe('врачей')
    expect(pluralizeRu(10, forms)).toBe('врачей')
    expect(pluralizeRu(100, forms)).toBe('врачей')
  })

  it('не сбивается на числах второго десятка', () => {
    // Классическая ловушка: 11 и 111 требуют форму «врачей», а не «врач».
    expect(pluralizeRu(11, forms)).toBe('врачей')
    expect(pluralizeRu(12, forms)).toBe('врачей')
    expect(pluralizeRu(14, forms)).toBe('врачей')
    expect(pluralizeRu(111, forms)).toBe('врачей')
  })

  it('склоняет ноль', () => {
    expect(pluralizeRu(0, forms)).toBe('врачей')
  })
})

describe('pluralizeDoctors', () => {
  it('даёт готовую форму слова «врач»', () => {
    expect(pluralizeDoctors(1)).toBe('врач')
    expect(pluralizeDoctors(3)).toBe('врача')
    expect(pluralizeDoctors(7)).toBe('врачей')
    expect(pluralizeDoctors(0)).toBe('врачей')
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/format.test.ts
```

Ожидается: провал — модуль `./format` не найден.

- [ ] **Step 3: Реализовать модуль**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/format.ts`:

```ts
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
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/format.test.ts
```

Ожидается: 6 тестов пройдено.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/search/format.ts web/lib/search/format.test.ts
git commit -m "feat(search): вынести склонения счётчика в отдельный модуль"
```

---

## Task 2: Состояние в адресной строке

Сейчас разбор состояния сидит внутри скрипта и читает `location.search` напрямую, поэтому непроверяем. Выносим, передавая строку параметром.

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/web/lib/search/state.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/search/state.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { activeChips, buildSearchQuery, readSearchState } from './state'

describe('readSearchState', () => {
  it('читает три поддерживаемых параметра', () => {
    expect(readSearchState('?q=иванов&specialty=стоматолог&lang=ky')).toEqual({
      q: 'иванов',
      specialty: 'стоматолог',
      lang: 'ky',
    })
  })

  it('отдаёт пустое состояние, когда параметров нет', () => {
    expect(readSearchState('')).toEqual({ q: '', specialty: '', lang: '' })
    expect(readSearchState('?')).toEqual({ q: '', specialty: '', lang: '' })
  })

  it('игнорирует параметры, которых больше нет', () => {
    // sort, rating, exp, accepting, format и city раньше читались и рисовали
    // чипы, но ни один из них не влиял на выдачу.
    const state = readSearchState(
      '?q=тест&sort=near&rating=4.5&exp=10&accepting=1&format=online&city=Бишкек',
    )
    expect(state).toEqual({ q: 'тест', specialty: '', lang: '' })
  })

  it('обрезает пробелы в запросе', () => {
    expect(readSearchState('?q=%20%20иванов%20%20').q).toBe('иванов')
  })

  it('приводит ключ специальности и код языка к нижнему регистру', () => {
    // В ссылках извне регистр может быть любым, а ключ должен совпасть.
    expect(readSearchState('?specialty=Стоматолог&lang=KY')).toEqual({
      q: '',
      specialty: 'стоматолог',
      lang: 'ky',
    })
  })
})

describe('buildSearchQuery', () => {
  it('собирает строку только из непустых значений', () => {
    expect(buildSearchQuery({ q: 'иванов', specialty: 'стоматолог', lang: 'ky' })).toBe(
      'q=%D0%B8%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&specialty=%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3&lang=ky',
    )
  })

  it('пропускает пустые значения', () => {
    expect(buildSearchQuery({ q: '', specialty: 'хирург', lang: '' })).toBe(
      'specialty=%D1%85%D0%B8%D1%80%D1%83%D1%80%D0%B3',
    )
  })

  it('отдаёт пустую строку для пустого состояния', () => {
    expect(buildSearchQuery({ q: '', specialty: '', lang: '' })).toBe('')
  })

  it('переживает круговой обход: разбор собранного даёт исходное состояние', () => {
    const state = { q: 'петров', specialty: 'стоматолог', lang: 'ru' }
    expect(readSearchState('?' + buildSearchQuery(state))).toEqual(state)
  })
})

describe('activeChips', () => {
  it('не показывает чипов при пустом состоянии', () => {
    expect(activeChips({ q: '', specialty: '', lang: '' }, {}, {})).toEqual([])
  })

  it('показывает подпись специальности, а не ключ', () => {
    const chips = activeChips(
      { q: '', specialty: 'стоматолог', lang: '' },
      { стоматолог: 'Стоматолог' },
      {},
    )
    expect(chips).toEqual([{ key: 'specialty', label: 'Стоматолог' }])
  })

  it('показывает подпись языка, а не код', () => {
    const chips = activeChips({ q: '', specialty: '', lang: 'ky' }, {}, { ky: 'Кыргызча' })
    expect(chips).toEqual([{ key: 'lang', label: 'Кыргызча' }])
  })

  it('показывает запрос в кавычках', () => {
    expect(activeChips({ q: 'иванов', specialty: '', lang: '' }, {}, {})).toEqual([
      { key: 'q', label: '«иванов»' },
    ])
  })

  it('падает обратно на сырое значение, если подписи нет', () => {
    // Ссылка из индекса поисковика может нести специальность, которой в
    // каталоге уже нет — чип обязан остаться снимаемым.
    expect(activeChips({ q: '', specialty: 'логопед', lang: '' }, {}, {})).toEqual([
      { key: 'specialty', label: 'логопед' },
    ])
  })

  it('перечисляет все активные фильтры разом', () => {
    const chips = activeChips(
      { q: 'иванов', specialty: 'стоматолог', lang: 'ky' },
      { стоматолог: 'Стоматолог' },
      { ky: 'Кыргызча' },
    )
    expect(chips.map((c) => c.key)).toEqual(['q', 'specialty', 'lang'])
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/state.test.ts
```

Ожидается: провал — модуль `./state` не найден.

- [ ] **Step 3: Реализовать модуль**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/state.ts`:

```ts
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
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/state.test.ts
```

Ожидается: 15 тестов пройдено.

Если тест на `buildSearchQuery` падает из-за кодирования кириллицы — сверить фактический вывод (`URLSearchParams` кодирует в процентную запись) и поправить ожидание в тесте.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/search/state.ts web/lib/search/state.test.ts
git commit -m "feat(search): вынести состояние адресной строки в отдельный модуль"
```

---

## Task 3: Фильтрация выдачи

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/web/lib/search/filter.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/search/filter.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/filter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { filterDoctors } from './filter'
import type { SearchableDoctor } from './filter'

function doctor(partial: Partial<SearchableDoctor> = {}): SearchableDoctor {
  return {
    fullName: 'Иванов Иван Иванович',
    specialty: 'Стоматолог',
    specialtyKey: 'стоматолог',
    subspecializations: [],
    languageCodes: ['ru'],
    ...partial,
  }
}

describe('filterDoctors', () => {
  it('без фильтров отдаёт весь список', () => {
    const items = [doctor(), doctor({ fullName: 'Петров Пётр' })]
    expect(filterDoctors(items, { q: '', specialty: '', lang: '' })).toHaveLength(2)
  })

  it('ищет по фамилии независимо от регистра', () => {
    const items = [doctor({ fullName: 'Надточий Дмитрий' }), doctor({ fullName: 'Петров Пётр' })]
    expect(filterDoctors(items, { q: 'НАДТОЧИЙ', specialty: '', lang: '' })).toHaveLength(1)
  })

  it('ищет по специальности', () => {
    const items = [doctor({ specialty: 'Хирург' }), doctor({ specialty: 'Стоматолог' })]
    expect(filterDoctors(items, { q: 'хирург', specialty: '', lang: '' })).toHaveLength(1)
  })

  it('ищет по суб-специализации — по ней и различают четырёх стоматологов', () => {
    const items = [
      doctor({ subspecializations: ['эндодонт', 'ортопед'] }),
      doctor({ subspecializations: ['терапевт'] }),
    ]
    expect(filterDoctors(items, { q: 'ортопед', specialty: '', lang: '' })).toHaveLength(1)
  })

  it('не ищет по названию места приёма', () => {
    // Сознательное решение: поиск идёт по врачу, не по клинике.
    const items = [doctor({ fullName: 'Иванов Иван' })]
    expect(filterDoctors(items, { q: 'айболит', specialty: '', lang: '' })).toHaveLength(0)
  })

  it('фильтрует по ключу специальности, а не по подписи', () => {
    // В базе встречается и «стоматолог», и «Стоматолог» — ключ схлопывает оба.
    const items = [
      doctor({ specialty: 'Стоматолог', specialtyKey: 'стоматолог' }),
      doctor({ specialty: 'Стоматолог', specialtyKey: 'стоматолог' }),
      doctor({ specialty: 'Хирург', specialtyKey: 'хирург' }),
    ]
    expect(filterDoctors(items, { q: '', specialty: 'стоматолог', lang: '' })).toHaveLength(2)
  })

  it('фильтрует по коду языка', () => {
    const items = [
      doctor({ languageCodes: ['ru', 'ky'] }),
      doctor({ languageCodes: ['ru'] }),
      doctor({ languageCodes: ['ru', 'en'] }),
    ]
    expect(filterDoctors(items, { q: '', specialty: '', lang: 'ky' })).toHaveLength(1)
  })

  it('применяет все три фильтра разом', () => {
    const items = [
      doctor({ fullName: 'Иванов Иван', specialtyKey: 'стоматолог', languageCodes: ['ru', 'ky'] }),
      doctor({ fullName: 'Иванов Пётр', specialtyKey: 'стоматолог', languageCodes: ['ru'] }),
      doctor({ fullName: 'Сидоров Иван', specialtyKey: 'хирург', languageCodes: ['ru', 'ky'] }),
    ]
    const found = filterDoctors(items, { q: 'иванов', specialty: 'стоматолог', lang: 'ky' })
    expect(found).toHaveLength(1)
    expect(found[0]?.fullName).toBe('Иванов Иван')
  })

  it('отдаёт пустой список, когда совпадений нет', () => {
    expect(filterDoctors([doctor()], { q: 'несуществующий', specialty: '', lang: '' })).toEqual([])
  })

  it('не меняет исходный массив и его порядок', () => {
    const items = [doctor({ fullName: 'Б' }), doctor({ fullName: 'А' })]
    const result = filterDoctors(items, { q: '', specialty: '', lang: '' })
    expect(result.map((d) => d.fullName)).toEqual(['Б', 'А'])
    expect(items).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/filter.test.ts
```

Ожидается: провал — модуль `./filter` не найден.

- [ ] **Step 3: Реализовать модуль**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/filter.ts`:

```ts
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
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/filter.test.ts
```

Ожидается: 10 тестов пройдено.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/search/filter.ts web/lib/search/filter.test.ts
git commit -m "feat(search): вынести фильтрацию выдачи в отдельный модуль"
```

---

## Task 4: Удалить сортировки

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro`

- [ ] **Step 1: Удалить разметку сортировок**

Удалить из разметки:

- мобильный блок с тремя ссылками `data-sort-tab` («Сначала: скоро», «Сначала: ближе», «Сначала: опытнее») вместе с обёрткой;
- десктопный блок сортировки: элементы с идентификаторами `dw-sort-menu` и `dw-sort-current` и обёртывающий их контрол.

Найти границы блоков:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'data-sort-tab\|dw-sort-menu\|dw-sort-current\|dw-sort-option\|toggle-sort' web/pages/search.astro
```

- [ ] **Step 2: Удалить логику сортировок из скрипта**

В теле скрипта удалить:

- константы `SORTS` и `SORT_LABELS`;
- ссылки на элементы `tabs`, `dwSortMenu`, `dwSortCurrent`;
- функции `parseKm` и `nextAvailableMs` (нужны были только для сортировок «ближе» и «скоро»);
- блок сортировки внутри `applyFilterAndSort` — из функции остаётся только фильтрация, и она заменяется вызовом `filterDoctors` в Task 7;
- обработчики кликов по вкладкам и по пунктам меню сортировки (`data-action="toggle-sort"`, `.dw-sort-option`);
- чтение `sort` в `readState` и его перенос в `buildQuery`.

- [ ] **Step 3: Проверить, что упоминаний не осталось**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -nc 'sort' web/pages/search.astro
```

Ожидается: `0`. Если что-то осталось — посмотреть каждое вхождение и удалить.

- [ ] **Step 4: Собрать и проверить страницу**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

Открыть `/search`: выдача отображается, вкладок сортировки нет, консоль чистая.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "refactor(search): убрать сортировки — под ними нет данных

«Скоро» требует ближайшего слота, «ближе» — координат, «опытнее» —
стажа. Выдача поиска бэкенда не отдаёт ни одного из трёх."
```

---

## Task 5: Удалить шторку фильтров, срез выдачи и пагинацию

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro`

- [ ] **Step 1: Удалить разметку шторки и пагинации**

Найти границы:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'filter-drawer\|dw-pagination\|drawer-count\|data-action="close-drawer"\|data-action="open-drawer"' web/pages/search.astro
```

Удалить целиком: элемент с идентификатором `filter-drawer`, его подложку `filter-drawer-backdrop`, кнопку открытия шторки, блок `dw-pagination`.

- [ ] **Step 2: Удалить логику шторки из скрипта**

Удалить: ссылки `drawer`, `drawerBackdrop`, `drawerCount`, `dwPagination`; функции `readDrawer`, `updateDrawerCount`, `syncDrawerFromState`, `applyDrawer`; ловушку фокуса и обработчики открытия и закрытия шторки.

- [ ] **Step 3: Снять срез выдачи**

Найти:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'PAGE_LIMIT' web/pages/search.astro
```

Удалить константу `PAGE_LIMIT` и заменить вызов вида `renderResults(filtered.slice(0, PAGE_LIMIT), filtered.length)` на `renderResults(filtered, filtered.length)`.

- [ ] **Step 4: Убедиться, что мёртвых упоминаний не осталось**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -nc 'drawer\|PAGE_LIMIT\|dw-pagination' web/pages/search.astro
```

Ожидается: `0`.

- [ ] **Step 5: Собрать и проверить**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

Открыть `/search`: выдача показывает всех врачей, кнопки «Все фильтры» нет, пагинации нет, консоль чистая.

- [ ] **Step 6: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "refactor(search): убрать шторку фильтров, срез выдачи и мёртвую пагинацию

Фильтры рейтинга, стажа и «принимает новых» не обеспечены данными.
Срез в 30 карточек расходился со счётчиком, а три кнопки пагинации
никогда не имели обработчиков."
```

---

## Task 6: Добавить фильтр языка приёма

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro`

- [ ] **Step 1: Добавить контрол в обе формы**

В мобильную форму (`#search-form`, рядом с выбором специальности) и в десктопную (`#dw-search-form`) добавить выпадающий список. Мобильный вариант:

```astro
      <label class="flex items-center gap-2 rounded-[14px] border border-hairline-strong bg-card-white px-3.5 py-2.5">
        <select
          id="search-lang"
          name="lang"
          class="bg-transparent text-[14px] text-graphite outline-none"
          aria-label="Язык приёма"
        >
          <option value="">Любой язык</option>
          {languageOptions.map((option) => (
            <option value={option.key}>{option.label}</option>
          ))}
        </select>
      </label>
```

Десктопный — по образцу соседнего поля специальности в `#dw-search-form`, с идентификатором `dw-search-lang` и тем же именем `lang`.

- [ ] **Step 2: Собрать список языков во frontmatter**

Пока страница работает на моках, список строится из них. Во frontmatter, рядом с существующей проекцией, добавить:

```ts
// Языки, реально встречающиеся у врачей. В следующем MR список приедет из
// каталога вместе с остальными опциями.
const languageOptions = Array.from(
  DOCTOR_MOCKS.reduce((acc, d) => {
    for (const code of d.languages ?? []) {
      acc.set(code, (acc.get(code) ?? 0) + 1)
    }
    return acc
  }, new Map<string, number>()),
)
  .map(([key, count]) => ({ key, label: key, count }))
  .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'))
```

Подписи здесь равны кодам — моки не несут человекочитаемых названий. В следующем MR они заменятся на «Русский», «Кыргызча», «English».

- [ ] **Step 3: Передать список в островок данных**

В островке `search-data` добавить `languageOptions` к передаваемым данным:

```astro
    set:html={serializeForJsonIsland({ specialtyLabels, doctorItems, languageOptions })}
```

и прочитать его в скрипте рядом с остальными:

```js
const languageOptions = payload.languageOptions || []
```

- [ ] **Step 4: Проверить**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

Открыть `/search`: в обеих формах есть выбор языка, выбор сужает выдачу, значение попадает в адресную строку как `?lang=…`.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "feat(search): фильтр по языку приёма"
```

---

## Task 7: Перевести скрипт на вынесенные модули

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro`

- [ ] **Step 1: Привести проекцию к форме, которую ждут модули**

`filterDoctors` требует полей `fullName`, `specialtyKey`, `subspecializations` и `languageCodes`, а мок-проекция отдаёт `name`, `specialty`, `subspecialty` и `languages`. Пока страница на моках, приводим проекцию к целевой форме — в следующем MR у неё сменится только источник.

Во frontmatter `web/pages/search.astro` заменить блок `const doctorItems = DOCTOR_MOCKS.map(...)` на:

```ts
// Форма записи совпадает с будущим поисковым индексом: в следующем MR
// сменится только источник данных, потребители останутся прежними.
const doctorItems = DOCTOR_MOCKS.map((d) => ({
  slug: doctorSlug(d),
  fullName: d.name,
  initials: d.initials,
  avatarColor: d.color,
  avatarUrl: null,
  specialty: d.specialty,
  specialtyKey: d.specialty.trim().toLowerCase(),
  subspecializations: d.subspecialty ? [d.subspecialty] : [],
  city: null,
  // В моках языки лежат подписями («Русский»), кодов там нет. Пока они же
  // работают ключами; в следующем MR подписи и коды разъедутся.
  languages: d.languages ?? [],
  languageCodes: (d.languages ?? []).map((l) => l.toLowerCase()),
  priceFrom: null,
  yearsExperience: d.yearsExperience ?? null,
  workplaces: d.clinic ? [{ name: d.clinic, address: '' }] : [],
  workplacesTotal: d.clinic ? 1 : 0,
}))
```

Соответственно поправить сборку `languageOptions` из Task 6 — она должна брать `d.languages` и приводить ключ к нижнему регистру, чтобы совпадать с `languageCodes`.

Ключи специальностей в моках получаются из подписей (`кардиолог`), поэтому ссылки вида `/search?specialty=кардиолог` уже работают. Ссылки на языке подписи (`?lang=русский`) сменятся на ISO-коды в следующем MR — витрина под запретом индексации, внешних ссылок на неё нет.

- [ ] **Step 2: Импортировать модули в скрипт**

В начало тела скрипта (после открытия `<script>`, до `(() => {`) добавить импорты:

```js
import { filterDoctors } from '../lib/search/filter'
import { pluralizeDoctors } from '../lib/search/format'
import { activeChips, buildSearchQuery, readSearchState } from '../lib/search/state'
```

- [ ] **Step 3: Заменить локальные реализации вызовами**

Удалить из скрипта локальные `pluralize`, `pDoctors`, `pDoctorsLong`, `pYears`, `pYearsShort`, `pReviews`, `readState`, `chipPills`, `buildQuery`, `applyFilterAndSort` и заменить их использования:

| Было                                  | Стало                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| `readState()`                         | `readSearchState(location.search)`                    |
| `applyFilterAndSort(allItems, state)` | `filterDoctors(allItems, state)`                      |
| `chipPills(state)`                    | `activeChips(state, specialtyLabels, languageLabels)` |
| `buildQuery(q, specialty, extra)`     | `buildSearchQuery({ q, specialty, lang })`            |
| `pDoctorsLong(n)`                     | `pluralizeDoctors(n)`                                 |

Словарь `languageLabels` собрать рядом с чтением данных:

```js
const languageLabels = Object.fromEntries(
  languageOptions.map((option) => [option.key, option.label]),
)
```

Функции `removeFilter` и `resetAllFilters` переписать через новые модули:

```js
function removeFilter(key) {
  const state = readSearchState(location.search)
  state[key] = ''
  const qs = buildSearchQuery(state)
  history.pushState({}, '', qs ? '/search?' + qs : '/search')
  load()
}

function resetAllFilters() {
  history.pushState({}, '', '/search')
  load()
}
```

- [ ] **Step 4: Убедиться, что старых реализаций не осталось**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -nc 'function pluralize\|function readState\|function chipPills\|function buildQuery\|function applyFilterAndSort' web/pages/search.astro
```

Ожидается: `0`.

- [ ] **Step 5: Прогнать проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check
```

Ожидается: всё зелёное.

- [ ] **Step 6: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "refactor(search): перевести скрипт на вынесенные модули логики"
```

---

## Task 8: Почистить карточки от полей без данных

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro` (шаблоны `#card-template` и `#dw-card-template`, функции `renderMobileCard` и `renderDesktopCard`)

- [ ] **Step 1: Убрать из мобильного шаблона**

Из `#card-template` удалить: бейдж `data-new-patients` и весь нижний блок «Ближайший слот» вместе с `data-slot`.

- [ ] **Step 2: Убрать из десктопного шаблона**

Из `#dw-card-template` удалить: чип рейтинга (`data-rating-block`, `data-rating`, `data-rating-count`), точку `data-online`, чип `data-accepting`, блок «Чаще всего обращаются» (`data-conditions-section`), расстояние `data-distance` и всю правую колонку `dw-card-booking` (недельная полоса `data-week`, `data-day`, `data-slot`, `data-slot-cta`).

Секции «Языки приёма» (`data-langs-section`) и чип стажа (`data-exp-chip`) **оставить** — они получат данные в следующем MR.

- [ ] **Step 3: Убрать соответствующий код рендеринга**

Из скрипта удалить: функции `buildWeekStrip`, `formatSlot`, `formatDayLabel`, `formatSlotTimeOnly`, константы `RU_MONTHS`, `RU_WEEKDAYS`, `dayMs`; в `renderMobileCard` и `renderDesktopCard` — все обращения к удалённым узлам.

- [ ] **Step 4: Проверить, что мёртвого кода не осталось**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -nc 'nextAvailable\|data-rating\|data-week\|data-slot\|acceptingNewPatients\|data-distance\|data-conditions' web/pages/search.astro
```

Ожидается: `0`.

- [ ] **Step 5: Добавить объявление живой области для счётчика**

Найти элемент счётчика результатов и добавить ему атрибут:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'id="result-meta"\|id="dw-results-count"' web/pages/search.astro
```

Обоим контейнерам со счётчиком добавить `aria-live="polite"` — выдача перерисовывается целиком, и без этого пользователь скринридера не узнаёт, что число совпадений изменилось.

- [ ] **Step 6: Собрать и проверить глазами**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

Открыть `/search` и проверить:

- [ ] карточки отображаются, звёзд рейтинга и «ближайшего слота» на них нет
- [ ] десктопная карточка не разъехалась после удаления правой колонки
- [ ] мобильная карточка выглядит целостно
- [ ] в консоли нет ошибок

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "refactor(search): убрать из карточек поля, которых нет в API

Рейтинг и число отзывов пусты у всех врачей, ближайшего слота,
расстояния и признака «принимает новых» в выдаче нет вовсе."
```

---

## Task 9: Финальная проверка MR

- [ ] **Step 1: Прогнать все проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm fsd
```

Ожидается: всё зелёное, тестов около 82.

- [ ] **Step 2: Проверить сценарии выдачи**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

- [ ] `/search` без параметров показывает всех врачей мока, счётчик совпадает с числом карточек
- [ ] поиск по строке работает, счётчик пересчитывается
- [ ] фильтр специальности работает
- [ ] фильтр языка работает
- [ ] чипы активных фильтров снимаются по клику
- [ ] «назад» в браузере возвращает предыдущее состояние
- [ ] прямое открытие `/search?q=иванов&lang=ru` применяет оба фильтра
- [ ] старая ссылка `/search?sort=near&rating=4.5` открывается без ошибок, лишние параметры игнорируются

- [ ] **Step 3: Проверить, что страница не потяжелела**

```bash
cd /Users/vladimir/Development/healthy-mobile && python3 - <<'PY'
import gzip, pathlib
p = pathlib.Path('dist/client/search/index.html')
raw = p.read_bytes()
print(f'{len(raw)} B raw / {len(gzip.compress(raw, 9))} B gzip')
PY
```

Ожидается: меньше, чем после MR 3 — удалено много разметки.

---

## Готовность MR

- [ ] Сортировок, шторки фильтров и пагинации нет
- [ ] Фильтров ровно три: строка, специальность, язык
- [ ] Выдача не режется по тридцать
- [ ] Логика состояния, фильтрации и склонений живёт в модулях под тестами
- [ ] Карточки не показывают полей, которых нет в API
- [ ] Счётчик результатов объявлен живой областью

**Следующий MR:** `2026-08-05-mr5-real-catalog.md` — реальный каталог в выдаче, новые поля карточки, главная и тексты.
