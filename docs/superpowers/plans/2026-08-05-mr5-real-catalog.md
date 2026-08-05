# MR 5: Реальный каталог в выдаче, карточка, главная и тексты — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести выдачу `/search` на реальный каталог врачей, пересобрать карточку вокруг имеющихся данных и убрать с витрины числа и обещания, которые перестали быть правдой.

**Architecture:** Проекция каталога в узкий поисковый индекс живёт в слайсе врача и покрыта тестами. Страница берёт каталог у общего загрузчика из MR 2, инлайнит индекс островком из MR 3 и фильтрует модулями из MR 4. Размер островка контролирует интеграция сборки: превышение бюджета останавливает сборку.

**Tech Stack:** Astro 7, Vitest 4, TypeScript 6 strict.

**Спека:** `docs/superpowers/specs/2026-08-05-doctors-search-astro-design.md`, разделы 5, 7 и 8.

**Зависит от:** MR 1 (раннер), MR 2 (загрузчик), MR 3 (островок данных), MR 4 (модули фильтрации).

---

## Отклонение от спеки, требующее решения

Спека требует перевести плитки специальностей на главной на фактический каталог. Проверка показала, что буквально это сделать нельзя: восемь плиток жёстко связаны с восемью иконками (`iconKey` — перечисление из `heart`, `brain`, `tooth` и так далее) и с бенто-раскладкой, где «Семейный врач» — широкая плитка-герой, а «Скорая» несёт диагональную ленту. Реальный каталог пересекается с этим набором ровно одной позицией — «Стоматолог». Построй плитки из каталога — на главной останется одна плитка и сетка развалится.

Поэтому плитки остаются на месте как навигация по специальностям, которые платформа намерена покрывать, но перестают врать:

- ссылка ведёт на нормализованный ключ, совпадающий с ключами каталога, — переход даёт корректную выдачу, а не промах;
- выдуманные счётчики (28, 22, 14 врачей) заменяются фактическими, и там, где врачей нет, число просто не показывается;
- разметка для поисковых систем (`medicalSpecialty`) строится из фактического каталога — там дизайн-ограничений нет.

Пустая выдача по плитке специальности, которой пока нет в каталоге, — честное состояние: страница показывает «никого не нашлось», а не пустоту без объяснения.

---

## File Structure

| Файл                                                       | Ответственность                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| `src/entities/doctor/model/doctor-view.ts` (изменить)      | Добавить `languageCodes` — фильтру нужны коды, а не подписи |
| `src/entities/doctor/model/search-index.ts` (создать)      | Тип индекса, проекция врача, построение списков опций       |
| `src/entities/doctor/model/search-index.test.ts` (создать) | Тесты проекции и опций                                      |
| `src/entities/doctor/index.ts` (изменить)                  | Экспорт индекса                                             |
| `web/integrations/search-index-budget.mjs` (создать)       | Контроль размера островка на сборке                         |
| `astro.config.mjs` (изменить)                              | Подключение интеграции                                      |
| `web/pages/search.astro` (изменить)                        | Каталог вместо моков, новые поля карточек, тексты           |
| `web/pages/index.astro` (изменить)                         | Ключи плиток, счётчики, разметка, чистка форм, тексты       |

---

## Task 1: Добавить коды языков в модель врача

`toDoctorListItem` сразу превращает языки в подписи, поэтому фильтровать по коду нечем.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/doctor-view.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/doctor-view.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/doctor-view.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { toDoctorListItem } from './doctor-view'
import type { DoctorSearchItemDto } from '../api/doctor-api.schema'

function dto(partial: Partial<DoctorSearchItemDto> = {}): DoctorSearchItemDto {
  return {
    id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    first_name: 'Иван',
    last_name: 'Иванов',
    middle_name: null,
    avatar_url: null,
    bio: null,
    specialization: 'стоматолог',
    primary_work_city: 'Бишкек',
    price_from: 1000,
    languages: ['ru', 'ky'],
    subspecializations: [],
    consultation_formats: [],
    schedule_note: null,
    chat_enabled: false,
    created_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  } as DoctorSearchItemDto
}

describe('toDoctorListItem', () => {
  it('сохраняет коды языков рядом с подписями', () => {
    // Подписи для показа, коды для фильтра и адресной строки: вывести одно
    // из другого на клиенте нечем, словарь живёт в src/.
    const item = toDoctorListItem(dto())
    expect(item.languages).toEqual(['Русский', 'Кыргызча'])
    expect(item.languageCodes).toEqual(['ru', 'ky'])
  })

  it('приводит коды к нижнему регистру', () => {
    expect(toDoctorListItem(dto({ languages: ['RU', 'Ky'] })).languageCodes).toEqual(['ru', 'ky'])
  })

  it('переживает отсутствие языков', () => {
    const item = toDoctorListItem(dto({ languages: [] }))
    expect(item.languages).toEqual([])
    expect(item.languageCodes).toEqual([])
  })

  it('нормализует регистр специальности', () => {
    expect(toDoctorListItem(dto({ specialization: 'стоматолог' })).specialization).toBe(
      'Стоматолог',
    )
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/model/doctor-view.test.ts
```

Ожидается: провал — у `DoctorListItem` нет поля `languageCodes`.

Если импорт `DoctorSearchItemDto` не резолвится — проверить фактическое имя и путь схемы: `grep -n 'export type DoctorSearchItemDto' src/entities/doctor/model/doctor-api.schema.ts` и поправить путь импорта в тесте.

- [ ] **Step 3: Добавить поле**

В `src/entities/doctor/model/doctor-view.ts` в интерфейс `DoctorListItem` добавить после `languages`:

```ts
  /** ISO-коды языков. Подписи в `languages` для показа, коды — для фильтра и URL. */
  languageCodes: string[]
```

и в `toDoctorListItem` после строки с `languages`:

```ts
    languageCodes: (dto.languages ?? []).map((code) => code.toLowerCase()),
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/model/doctor-view.test.ts
```

Ожидается: 4 теста пройдено.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/model/doctor-view.ts src/entities/doctor/model/doctor-view.test.ts
git commit -m "feat(doctor): хранить коды языков рядом с подписями"
```

---

## Task 2: Проекция каталога в поисковый индекс

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/search-index.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/search-index.test.ts`
- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/index.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/search-index.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { DoctorProfileView } from './doctor-view'
import { buildLanguageOptions, buildSpecialtyOptions, toSearchIndexItem } from './search-index'

function profile(partial: Partial<DoctorProfileView> = {}): DoctorProfileView {
  return {
    id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    shortName: 'Иванов Иван',
    fullName: 'Иванов Иван Иванович',
    initials: 'ИИ',
    avatarColor: '#E8D5C4',
    specialization: 'Стоматолог',
    city: 'Бишкек',
    priceFrom: 1000,
    languages: ['Русский'],
    languageCodes: ['ru'],
    avatarUrl: null,
    bio: null,
    education: null,
    scheduleNote: null,
    subspecializations: [],
    yearsExperience: 10,
    rating: null,
    reviewsCount: 0,
    consultationFormats: [],
    workplaces: [],
    appointmentTypes: [],
    ...partial,
  }
}

describe('toSearchIndexItem', () => {
  it('кладёт в индекс подпись и ключ специальности', () => {
    const item = toSearchIndexItem(profile({ specialization: 'Стоматолог' }), 'ivanov-ivan-id')
    expect(item.specialty).toBe('Стоматолог')
    expect(item.specialtyKey).toBe('стоматолог')
  })

  it('не тащит в индекс поля, нужные только странице врача', () => {
    const item = toSearchIndexItem(profile({ bio: 'длинная биография', education: 'КРСУ' }), 'slug')
    expect(item).not.toHaveProperty('bio')
    expect(item).not.toHaveProperty('education')
    expect(item).not.toHaveProperty('appointmentTypes')
  })

  it('обрезает места приёма до двух, но помнит, сколько их всего', () => {
    // Иначе подпись «ещё N» посчитается по обрезанному массиву и соврёт.
    const item = toSearchIndexItem(
      profile({
        workplaces: [
          {
            id: '1',
            name: 'Айболит',
            address: '6 мкр, 25',
            description: null,
            coordinates: null,
            mapImageUrl: null,
          },
          {
            id: '2',
            name: 'Из дома',
            address: 'мкр. Асанбай, 14',
            description: null,
            coordinates: null,
            mapImageUrl: null,
          },
          {
            id: '3',
            name: 'Biostom',
            address: 'Киевская 200',
            description: null,
            coordinates: null,
            mapImageUrl: null,
          },
        ],
      }),
      'slug',
    )
    expect(item.workplaces).toHaveLength(2)
    expect(item.workplacesTotal).toBe(3)
    expect(item.workplaces[0]).toEqual({ name: 'Айболит', address: '6 мкр, 25' })
  })

  it('переживает врача без мест приёма — такой в каталоге есть', () => {
    const item = toSearchIndexItem(profile({ workplaces: [] }), 'slug')
    expect(item.workplaces).toEqual([])
    expect(item.workplacesTotal).toBe(0)
  })

  it('переносит стаж и цену числами, а не готовыми строками', () => {
    // Стаж отсчитывается от текущей даты: подпись, посчитанная на сборке,
    // стареет вместе со статической страницей.
    const item = toSearchIndexItem(profile({ yearsExperience: 6, priceFrom: 1500 }), 'slug')
    expect(item.yearsExperience).toBe(6)
    expect(item.priceFrom).toBe(1500)
  })

  it('переживает отсутствие цены и стажа', () => {
    const item = toSearchIndexItem(profile({ yearsExperience: null, priceFrom: null }), 'slug')
    expect(item.yearsExperience).toBeNull()
    expect(item.priceFrom).toBeNull()
  })

  it('кладёт слаг, а идентификатор не дублирует', () => {
    const item = toSearchIndexItem(profile(), 'ivanov-ivan-3f2504e0')
    expect(item.slug).toBe('ivanov-ivan-3f2504e0')
    expect(item).not.toHaveProperty('id')
  })
})

describe('buildSpecialtyOptions', () => {
  it('схлопывает разный регистр в одну опцию', () => {
    // В проде «стоматолог» и «Стоматолог» — это четыре врача, а не два и два.
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'СТОМАТОЛОГ' }),
      profile({ specialization: '  Стоматолог  ' }),
    ])
    expect(options).toHaveLength(1)
    expect(options[0]?.key).toBe('стоматолог')
    expect(options[0]?.count).toBe(4)
  })

  it('берёт самое частое написание как подпись', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'СТОМАТОЛОГ' }),
    ])
    expect(options[0]?.label).toBe('Стоматолог')
  })

  it('при равной частоте берёт первое встреченное — результат сборки детерминирован', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'СТОМАТОЛОГ' }),
      profile({ specialization: 'Стоматолог' }),
    ])
    expect(options[0]?.label).toBe('СТОМАТОЛОГ')
  })

  it('сортирует по убыванию числа врачей', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Хирург' }),
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'Стоматолог' }),
    ])
    expect(options.map((o) => o.key)).toEqual(['стоматолог', 'хирург'])
  })

  it('при равном числе врачей сортирует по подписи', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Хирург' }),
      profile({ specialization: 'Гинеколог' }),
    ])
    expect(options.map((o) => o.label)).toEqual(['Гинеколог', 'Хирург'])
  })

  it('пропускает пустую специальность', () => {
    expect(buildSpecialtyOptions([profile({ specialization: '' })])).toEqual([])
  })
})

describe('buildLanguageOptions', () => {
  it('считает врачей по каждому коду и подписывает по-человечески', () => {
    const options = buildLanguageOptions([
      profile({ languageCodes: ['ru', 'ky'] }),
      profile({ languageCodes: ['ru'] }),
      profile({ languageCodes: ['ru', 'en'] }),
    ])
    expect(options.map((o) => [o.key, o.count])).toEqual([
      ['ru', 3],
      ['en', 1],
      ['ky', 1],
    ])
    expect(options.find((o) => o.key === 'ky')?.label).toBe('Кыргызча')
  })

  it('не теряет незнакомый код', () => {
    const options = buildLanguageOptions([profile({ languageCodes: ['de'] })])
    expect(options[0]).toEqual({ key: 'de', label: 'DE', count: 1 })
  })

  it('отдаёт пустой список для каталога без языков', () => {
    expect(buildLanguageOptions([profile({ languageCodes: [] })])).toEqual([])
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/model/search-index.test.ts
```

Ожидается: провал — модуль `./search-index` не найден.

- [ ] **Step 3: Реализовать модуль**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/model/search-index.ts`:

```ts
import { formatLanguages } from '../lib/doctor-display'
import type { DoctorProfileView } from './doctor-view'

/**
 * Запись поискового индекса — то, что уезжает в HTML страницы выдачи.
 *
 * Несёт сырые значения, а не готовые строки: логика выдачи бандлится и сама
 * импортирует форматирование. Подпись стажа, посчитанная на сборке, старела бы
 * вместе со статической страницей.
 *
 * Поля, по которым идёт фильтрация, лежат дважды: стабильный ключ для
 * сравнения и подпись для показа. Клиенту нечем вывести одно из другого.
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

/** Опция выпадающего списка фильтра. */
export interface FilterOption {
  key: string
  label: string
  count: number
}

/**
 * Мест приёма в карточке показывается одно, второе — про запас на случай
 * смены вёрстки. Массив самое тяжёлое поле индекса, тащить все места незачем.
 */
export const SEARCH_INDEX_MAX_WORKPLACES = 2

/** Ключ группировки специальности: снимает разнобой регистра и пробелов. */
export function specialtyKeyOf(specialization: string): string {
  return specialization.trim().toLowerCase()
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

    workplaces: doctor.workplaces.slice(0, SEARCH_INDEX_MAX_WORKPLACES).map((place) => ({
      name: place.name,
      address: place.address,
    })),
    workplacesTotal: doctor.workplaces.length,
  }
}

interface OptionAccumulator {
  label: string
  count: number
  /** Сколько раз встретилось написание, выбранное подписью. */
  labelCount: number
}

function sortOptions(options: FilterOption[]): FilterOption[] {
  return options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'))
}

/**
 * Список специальностей для фильтра — из фактического каталога, а не из
 * статического конфига: иначе в списке окажутся специальности без врачей.
 *
 * Подпись — самое частое написание в группе. При равной частоте побеждает
 * встреченное первым, чтобы результат сборки не плавал.
 */
export function buildSpecialtyOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  const groups = new Map<string, OptionAccumulator>()
  const spellings = new Map<string, Map<string, number>>()

  for (const doctor of doctors) {
    const key = specialtyKeyOf(doctor.specialization)
    if (!key) continue

    const seen = spellings.get(key) ?? new Map<string, number>()
    const spelling = doctor.specialization.trim()
    const spellingCount = (seen.get(spelling) ?? 0) + 1
    seen.set(spelling, spellingCount)
    spellings.set(key, seen)

    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, { label: spelling, count: 1, labelCount: spellingCount })
      continue
    }

    group.count += 1
    if (spellingCount > group.labelCount) {
      group.label = spelling
      group.labelCount = spellingCount
    }
  }

  return sortOptions(
    Array.from(groups, ([key, group]) => ({ key, label: group.label, count: group.count })),
  )
}

/** Список языков приёма из фактического каталога. */
export function buildLanguageOptions(doctors: readonly DoctorProfileView[]): FilterOption[] {
  const counts = new Map<string, number>()

  for (const doctor of doctors) {
    for (const code of doctor.languageCodes) {
      const key = code.trim().toLowerCase()
      if (!key) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return sortOptions(
    Array.from(counts, ([key, count]) => ({
      key,
      label: formatLanguages([key])[0] ?? key.toUpperCase(),
      count,
    })),
  )
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/model/search-index.test.ts
```

Ожидается: 16 тестов пройдено.

- [ ] **Step 5: Экспортировать из слайса**

В `src/entities/doctor/index.ts` добавить:

```ts
export {
  buildLanguageOptions,
  buildSpecialtyOptions,
  specialtyKeyOf,
  toSearchIndexItem,
} from './model/search-index'
export type { FilterOption, SearchIndexItem } from './model/search-index'
```

- [ ] **Step 6: Проверить типы и FSD**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit && pnpm exec steiger ./src
```

Ожидается: обе команды успешны.

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/model/search-index.ts src/entities/doctor/model/search-index.test.ts src/entities/doctor/index.ts
git commit -m "feat(search): проекция каталога в поисковый индекс и опции фильтров"
```

---

## Task 3: Перевести выдачу на реальный каталог

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro` (frontmatter)

- [ ] **Step 1: Переписать frontmatter**

Заменить импорты моков и проекцию. Было (импорты):

```ts
import { SPECIALTIES } from '@/shared/config'
import { DOCTOR_MOCKS } from '@/entities/doctor/mock/doctors.mock'
import { doctorSlug } from '../lib/slug'
```

Стало:

```ts
import {
  loadDoctorCatalog,
  toSearchIndexItem,
  buildSpecialtyOptions,
  buildLanguageOptions,
} from '@/entities/doctor'
import { doctorProfileSlug } from '../lib/slug'
```

Заменить весь блок проекции (`const specialtyLabels = …` и `const doctorItems = DOCTOR_MOCKS.map(…)`, а также временный `languageOptions` из MR 4) на:

```ts
// Каталог берётся из общего загрузчика: getStaticPaths страницы врача уже
// прогрел его к этому моменту, повторных запросов не будет.
const catalog = await loadDoctorCatalog()

const doctorItems = catalog.map((doctor) => toSearchIndexItem(doctor, doctorProfileSlug(doctor)))
const specialtyOptions = buildSpecialtyOptions(catalog)
const languageOptions = buildLanguageOptions(catalog)
const doctorsTotal = catalog.length
```

- [ ] **Step 2: Обновить выпадающие списки в разметке**

Оба списка специальностей (в мобильной и десктопной формах) построены из `SPECIALTIES`. Найти:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'SPECIALTIES' web/pages/search.astro
```

Заменить каждый цикл на построение из `specialtyOptions`:

```astro
          {specialtyOptions.map((option) => (
            <option value={option.key}>{option.label} ({option.count})</option>
          ))}
```

Списки языков (добавлены в MR 4) уже читают `languageOptions` — они теперь получают человекочитаемые подписи автоматически.

- [ ] **Step 3: Передать опции в островок данных**

Заменить содержимое островка:

```astro
    set:html={serializeForJsonIsland({ doctorItems, specialtyOptions, languageOptions })}
```

и чтение в скрипте:

```js
const doctorItems = payload.doctorItems || []
const specialtyOptions = payload.specialtyOptions || []
const languageOptions = payload.languageOptions || []
const specialtyLabels = Object.fromEntries(
  specialtyOptions.map((option) => [option.key, option.label]),
)
const languageLabels = Object.fromEntries(
  languageOptions.map((option) => [option.key, option.label]),
)
```

- [ ] **Step 4: Собрать и проверить, что в выдаче реальные врачи**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && grep -c 'Надточий\|Куликов\|Галивец' dist/client/search/index.html
```

Ожидается: число больше нуля — это фамилии из реального каталога. Дополнительно убедиться, что моков не осталось:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -c 'Кадыров\|Соколова' dist/client/search/index.html
```

Ожидается: `0`.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "feat(search): перевести выдачу на реальный каталог врачей

Страница держалась на DOCTOR_MOCKS, пока главная и страницы врачей
уже работали на API — на витрине жили два разных списка врачей."
```

---

## Task 4: Пересобрать карточки вокруг имеющихся данных

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro` (шаблоны и рендереры)

- [ ] **Step 1: Дополнить мобильный шаблон**

В `#card-template` строка `data-clinic` теперь показывает место приёма и город, а в блок `data-meta` уезжают стаж, цена и языки. Разметку менять не требуется — меняется наполнение в рендерере.

- [ ] **Step 2: Переписать рендерер мобильной карточки**

В `renderMobileCard` заполнение полей привести к новым данным:

```js
function renderMobileCard(d) {
  const frag = template.content.cloneNode(true)
  const li = frag.querySelector('li')
  li.querySelector('[data-link]').href = '/doctor/' + d.slug

  const avatar = li.querySelector('[data-avatar]')
  avatar.textContent = d.initials
  avatar.style.background = d.avatarColor

  li.querySelector('[data-eyebrow]').textContent = d.specialty
  li.querySelector('[data-name]').textContent = d.fullName

  // Место приёма и город. У врача может не быть ни одного места —
  // строка тогда просто пустая, а не «undefined».
  const place = d.workplaces[0]
  const placeParts = []
  if (place) placeParts.push(place.name)
  if (d.city) placeParts.push(d.city)
  if (d.workplacesTotal > 1) placeParts.push('ещё ' + (d.workplacesTotal - 1))
  li.querySelector('[data-clinic]').textContent = placeParts.join(' · ')

  const meta = li.querySelector('[data-meta]')
  meta.textContent = ''
  const experience = formatExperienceLabel(d.yearsExperience)
  if (experience) {
    const s = document.createElement('span')
    s.textContent = experience
    meta.appendChild(s)
  }
  const price = formatPriceKgs(d.priceFrom)
  if (price) {
    const s = document.createElement('span')
    s.textContent = 'от ' + price
    meta.appendChild(s)
  }
  if (d.subspecializations.length > 0) {
    const s = document.createElement('span')
    s.textContent = d.subspecializations.join(' · ')
    meta.appendChild(s)
  }

  return frag
}
```

- [ ] **Step 3: Импортировать форматирование в скрипт**

К импортам скрипта добавить:

```js
import { formatExperienceLabel, formatPriceKgs } from '@/entities/doctor'
```

Это и есть выигрыш от бандлящегося скрипта: форматирование берётся из общего модуля, а не дублируется.

- [ ] **Step 4: Переписать рендерер десктопной карточки**

Заменить `renderDesktopCard` целиком:

```js
function renderDesktopCard(d) {
  if (!dwTemplate) return null
  const frag = dwTemplate.content.cloneNode(true)
  const li = frag.querySelector('li')

  li.querySelector('[data-link]').href = '/doctor/' + d.slug

  // ЛЕВО — инициалы. Фото есть у одного врача из семи, поэтому подложка
  // с инициалами это основной вид, а не запасной.
  const initials = li.querySelector('[data-initials]')
  initials.textContent = d.initials
  initials.style.background = d.avatarColor

  // ЦЕНТР — имя, чипы, специальность, секции, место приёма
  li.querySelector('[data-name]').textContent = d.fullName
  li.querySelector('[data-spec]').textContent = d.specialty

  const expChip = li.querySelector('[data-exp-chip]')
  const experience = formatExperienceLabel(d.yearsExperience)
  if (experience) {
    expChip.hidden = false
    expChip.querySelector('[data-exp]').textContent = 'Стаж ' + experience
  }

  // Направления работы — то, чем различаются четыре стоматолога.
  if (d.subspecializations.length > 0) {
    const sec = li.querySelector('[data-subspecs-section]')
    sec.hidden = false
    li.querySelector('[data-subspecs]').textContent = d.subspecializations.join(' · ')
  }

  if (d.languages.length > 0) {
    const sec = li.querySelector('[data-langs-section]')
    sec.hidden = false
    li.querySelector('[data-langs]').textContent = d.languages.join(', ')
  }

  // Место приёма и город. Подпись нейтральная: среди значений
  // встречается «Из дома», это не клиника.
  const place = d.workplaces[0]
  const placeParts = []
  if (place) placeParts.push(place.name)
  if (d.city) placeParts.push(d.city)
  if (d.workplacesTotal > 1) placeParts.push('ещё ' + (d.workplacesTotal - 1))
  li.querySelector('[data-clinic]').textContent = placeParts.join(' · ')

  // ПРАВО — цена и переход к записи вместо снятой полосы слотов.
  const price = formatPriceKgs(d.priceFrom)
  const priceEl = li.querySelector('[data-price]')
  if (price) {
    priceEl.textContent = 'от ' + price
  } else {
    priceEl.hidden = true
  }

  return frag
}
```

Под этот код в шаблоне `#dw-card-template` нужны новые узлы — блок «Чаще всего обращаются» и правая колонка записи удалены в MR 4. Добавить секцию направлений по образцу соседней секции языков (та же вёрстка `dw-card-section`):

```astro
          <div class="dw-card-section" data-subspecs-section hidden>
            <span class="dw-card-section-label">Направления</span>
            <span class="dw-card-section-value" data-subspecs></span>
          </div>
```

и правую колонку:

```astro
        <div class="dw-card-booking">
          <span class="dw-card-price" data-price></span>
          <span class="dw-card-book-cta">Записаться</span>
        </div>
```

- [ ] **Step 5: Проверить граничные случаи в собранной витрине**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

Открыть `/search` и убедиться:

- [ ] у врача с двумя местами приёма подпись содержит «ещё 1»
- [ ] у врача без мест приёма строка места не пустая и не сломанная (виден город)
- [ ] у врача, начавшего практику в этом году, стоит «Менее года», а не «0 лет»
- [ ] у врача из Ананьево виден именно Ананьево
- [ ] цена отображается как «от 1 000 с»
- [ ] карточка без суб-специализаций не имеет пустой строки

- [ ] **Step 6: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "feat(search): карточка врача на реальных полях каталога

Стаж, город, места приёма, цена, языки и суб-специализации — всё,
что бэкенд действительно отдаёт."
```

---

## Task 5: Контроль размера индекса на сборке

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/web/integrations/search-index-budget.mjs`
- Modify: `/Users/vladimir/Development/healthy-mobile/astro.config.mjs`

- [ ] **Step 1: Написать интеграцию**

Создать `/Users/vladimir/Development/healthy-mobile/web/integrations/search-index-budget.mjs`:

```js
import { readFile } from 'node:fs/promises'
import { brotliCompressSync } from 'node:zlib'

/**
 * Следит за весом поискового индекса, инлайненного в /search.
 *
 * Индекс лежит прямо в HTML, и это осознанно: отдельный файл стоил бы лишнего
 * round-trip, а на 3G он дороже пары килобайт. Но у решения есть порог —
 * примерно триста врачей. Дальше индекс надо выносить в отдельный файл и
 * возвращать постраничность, иначе страница начинает грузиться заметно дольше.
 *
 * Порог проверяется здесь, а не в CI: конфигурации CI в репозитории нет.
 */
const WARN_BYTES = 20 * 1024
const FAIL_BYTES = 30 * 1024

export default function searchIndexBudget() {
  return {
    name: 'hm:search-index-budget',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const page = new URL('search/index.html', dir)

        let html
        try {
          html = await readFile(page, 'utf8')
        } catch {
          logger.warn('страница /search не найдена — бюджет индекса не проверен')
          return
        }

        const match = html.match(/<script[^>]+id="search-data"[^>]*>([\s\S]*?)<\/script>/u)
        if (match === null) {
          logger.warn('островок search-data не найден — бюджет индекса не проверен')
          return
        }

        const payload = match[1] ?? ''
        const raw = Buffer.byteLength(payload, 'utf8')
        const compressed = brotliCompressSync(Buffer.from(payload, 'utf8')).byteLength

        const report = `индекс поиска: ${(raw / 1024).toFixed(1)} КБ, после сжатия ${(compressed / 1024).toFixed(1)} КБ`

        if (compressed > FAIL_BYTES) {
          throw new Error(
            `${report}. Превышен бюджет ${(FAIL_BYTES / 1024).toFixed(0)} КБ: пора выносить индекс ` +
              'в отдельный файл и возвращать постраничность — см. спеку поиска, раздел 5.',
          )
        }

        if (compressed > WARN_BYTES) {
          logger.warn(`${report} — приближается к порогу выноса в отдельный файл`)
          return
        }

        logger.info(report)
      },
    },
  }
}
```

- [ ] **Step 2: Подключить интеграцию**

В `astro.config.mjs` добавить импорт рядом с существующими:

```js
import searchIndexBudget from './web/integrations/search-index-budget.mjs'
```

и в массив `integrations` после `cfWranglerMirror()`:

```js
    searchIndexBudget(),
```

- [ ] **Step 3: Проверить, что интеграция отчитывается**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build 2>&1 | grep -i 'индекс поиска'
```

Ожидается: строка вида «индекс поиска: 4.8 КБ, после сжатия 1.2 КБ». На семи врачах бюджет далёк.

- [ ] **Step 4: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/integrations/search-index-budget.mjs astro.config.mjs
git commit -m "build(search): следить за весом инлайнового индекса на сборке"
```

---

## Task 6: Главная — честные ключи, счётчики и разметка

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/index.astro`

- [ ] **Step 1: Посчитать специальности каталога во frontmatter**

Добавить к существующей загрузке каталога:

```ts
import { buildSpecialtyOptions, specialtyKeyOf } from '@/entities/doctor'

const specialtyOptions = buildSpecialtyOptions(doctors)
const doctorsBySpecialtyKey = new Map(specialtyOptions.map((option) => [option.key, option.count]))
```

- [ ] **Step 2: Перевести ссылки плиток на ключи каталога**

Найти построение ссылок плиток:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'specialty=' web/pages/index.astro
```

Каждую ссылку вида `/search?specialty=${s.doctorSpecialty}` заменить на нормализованный ключ:

```astro
href={`/search?specialty=${encodeURIComponent(specialtyKeyOf(s.doctorSpecialty))}`}
```

Так плитка ведёт на тот же ключ, по которому фильтрует выдача, — иначе переход всегда даёт пустой результат.

- [ ] **Step 3: Заменить выдуманные счётчики фактическими**

В конфиге `SPECIALTIES` у каждой плитки зашито поле `count` (28, 22, 14 врачей и так далее) — это выдумка. Вместо него показывать фактическое число, а при нуле не показывать ничего:

```astro
{doctorsBySpecialtyKey.get(specialtyKeyOf(s.doctorSpecialty)) ? (
  <span class="mw-cat-count">{doctorsBySpecialtyKey.get(specialtyKeyOf(s.doctorSpecialty))}</span>
) : null}
```

Точное имя класса взять из существующей разметки плитки — заменяется только источник числа и условие показа.

Плитки со нулём врачей остаются на месте: они задают навигацию по специальностям, которые платформа намерена покрывать, а их скрытие развалило бы бенто-сетку (иконки и раскладка привязаны к фиксированному набору из восьми). Переход по такой плитке показывает честное пустое состояние.

- [ ] **Step 4: Перевести разметку для поисковых систем на каталог**

Найти:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'medicalSpecialty' web/pages/index.astro
```

Заменить на фактические специальности:

```ts
  medicalSpecialty: specialtyOptions.map((option) => option.label),
```

Здесь дизайн-ограничений нет, и перечислять специальности, которых на витрине не существует, незачем.

- [ ] **Step 5: Перевести десктопный выбор специальности**

Список `<select name="specialty">` на главной строится из `SPECIALTIES`. Заменить на `specialtyOptions`, чтобы значения совпадали с ключами выдачи:

```astro
                  {specialtyOptions.map((option) => (
                    <option value={option.key}>{option.label}</option>
                  ))}
```

- [ ] **Step 6: Проверить переходы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

- [ ] клик по плитке «Стоматология» открывает `/search` с непустой выдачей
- [ ] клик по плитке специальности, которой нет в каталоге, открывает выдачу с честным пустым состоянием
- [ ] выбор специальности в десктопной форме главной приводит к непустой выдаче

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/index.astro
git commit -m "fix(home): плитки специальностей ведут на ключи реального каталога

Ссылки несли значения из мок-конфига и после перевода фильтра давали
бы пустую выдачу; счётчики врачей были выдуманы, а разметка для
поисковых систем перечисляла отсутствующие специальности."
```

---

## Task 7: Главная — убрать контролы, которые ни на что не влияют

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/index.astro`

- [ ] **Step 1: Найти мёртвые контролы**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'name="format"\|name="district"\|name="clinic"\|name="city"' web/pages/index.astro
```

- [ ] **Step 2: Удалить их вместе с разметкой**

Удалить из обеих форм: радиогруппу «Все / Онлайн / В клинике» (`name="format"`, три поля и их подписи), выпадающие списки района и клиники (`name="district"`, `name="clinic"`), скрытое поле `name="city"`.

Удаляются сами контролы, а не только имена параметров: контрол, который ничего не меняет, хуже отсутствующего. Заодно убрать осиротевшие стили этих блоков.

- [ ] **Step 3: Исправить плейсхолдеры, обещающие поиск по клинике**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -rn 'placeholder=' web/pages/index.astro web/pages/search.astro
```

Заменить «Врач, специальность, клиника» и «Имя, специальность, клиника» на «Имя или специальность» — поиск по названию места приёма не ведётся, и обещать его нельзя.

- [ ] **Step 4: Проверить формы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && pnpm preview
```

- [ ] мобильная форма главной отправляет только запрос и открывает выдачу
- [ ] десктопная форма отправляет запрос и специальность
- [ ] в адресной строке выдачи нет посторонних параметров

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/index.astro web/pages/search.astro
git commit -m "fix(home): убрать фильтры формы, которые ни на что не влияли

Формат приёма, район, клиника и скрытый город отправлялись в выдачу,
где не читались вовсе. Плейсхолдеры обещали поиск по клинике,
которого нет."
```

---

## Task 8: Убрать числа и географию, которые перестали быть правдой

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro`
- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/index.astro`

- [ ] **Step 1: Найти все места**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n '1 200\|2 800\|в Бишкеке\|принимают в' web/pages/search.astro web/pages/index.astro
```

Ожидается примерно семь мест: на `/search` — «1 200+ проверенных специалистов», « принимают в Бишкеке», заголовок в `<title>`, в H1 и дважды в клиентском скрипте (включая шаблон «{специальность} в Бишкеке»); на главной — «2 800+ врачей в одном приложении» и кнопка «Найти 2 800+ врачей».

- [ ] **Step 2: Заменить счётчики фактическим числом**

На `/search` строку доверия заменить на живое число (переменная `doctorsTotal` добавлена в Task 3), склоняя через модуль из MR 4:

```astro
          {doctorsTotal} {pluralizeDoctors(doctorsTotal)} · бесплатная отмена за 2 часа
```

добавив во frontmatter импорт:

```ts
import { pluralizeDoctors } from '../lib/search/format'
```

На главной обе строки с «2 800+» заменить на `doctors.length` с тем же склонением.

- [ ] **Step 3: Убрать географию из заголовков**

Заменить «Найти врача в Бишкеке» на «Найти врача» в `<title>` и H1 страницы `/search`, а в клиентском скрипте — оба места, включая шаблон подстановки специальности («{специальность} в Бишкеке» → «{специальность}»). Убрать « принимают в Бишкеке» из строки счётчика десктопной выдачи.

Каталог не только бишкекский — в нём есть врач из Ананьево. Обещать город, которого у врача может не быть, — та же ошибка, что обещать 1 200 специалистов при семи.

- [ ] **Step 4: Проверить, что ложных утверждений не осталось**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null && grep -c '1 200\|2 800\|в Бишкеке' dist/client/search/index.html dist/client/index.html
```

Ожидается: `0` в обоих файлах.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro web/pages/index.astro
git commit -m "fix(copy): заменить выдуманные счётчики врачей фактическими

Витрина обещала 1 200 и 2 800 специалистов при семи в каталоге и
приписывала всех Бишкеку, хотя один врач принимает в Ананьево."
```

---

## Task 9: Финальная проверка MR

- [ ] **Step 1: Прогнать все проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm fsd
```

Ожидается: всё зелёное, тестов около 102.

- [ ] **Step 2: Убедиться, что моки ушли из зоны витрины**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -rn 'DOCTOR_MOCKS\|doctors.mock' web/ | wc -l
```

Ожидается: `0`.

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -c 'Кадыров\|Соколова' dist/client/search/index.html dist/client/index.html
```

Ожидается: `0` в обоих. В `dist/client/_astro/*.js` мок-строки остаются — они попадают туда через экраны приложения, которых работа не касается.

- [ ] **Step 3: Проверить, что ссылки выдачи ведут на существующие страницы**

```bash
cd /Users/vladimir/Development/healthy-mobile && python3 - <<'PY'
import pathlib, re, json
root = pathlib.Path('dist/client')
built = {p.parent.name for p in root.glob('doctor/*/index.html')}
html = (root / 'search/index.html').read_text(encoding='utf-8')
island = re.search(r'<script[^>]+id="search-data"[^>]*>([\s\S]*?)</script>', html)
items = json.loads(island.group(1)).get('doctorItems', [])
missing = {i['slug'] for i in items} - built
print(f'врачей в индексе: {len(items)}, страниц собрано: {len(built)}')
print('ссылки в никуда:', missing or 'нет')
PY
```

Ожидается: «ссылки в никуда: нет», число врачей в индексе совпадает с числом страниц.

- [ ] **Step 4: Пройти сценарии выдачи**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm preview
```

- [ ] `/search` показывает всех врачей каталога, счётчик совпадает с числом карточек
- [ ] фильтр «Стоматолог» находит всех четверых, несмотря на разное написание в базе
- [ ] фильтр языка «Кыргызча» находит троих
- [ ] поиск по суб-специализации («ортопед») находит нужного врача
- [ ] несовпадающий запрос даёт честное пустое состояние
- [ ] ссылка `/search?specialty=стоматолог&lang=ky` открывается с применёнными фильтрами
- [ ] «назад» возвращает предыдущее состояние
- [ ] переход с плитки главной даёт непустую выдачу
- [ ] карточка врача без мест приёма выглядит целостно
- [ ] у врача со стажем меньше года написано «Менее года»

---

## Готовность MR

- [ ] Выдача работает на реальном каталоге, моков в зоне витрины нет
- [ ] Карточка показывает стаж, город, места приёма, цену, языки и суб-специализации
- [ ] Опции фильтров построены из каталога, разнобой регистра схлопнут
- [ ] Ссылки выдачи ведут только на существующие страницы
- [ ] Плитки главной ведут на ключи каталога, счётчики фактические
- [ ] На витрине нет выдуманных чисел и обещаний географии
- [ ] Вес индекса под контролем интеграции сборки

**Работа по спеке завершена.** Отложенное с порогами (расширение поиска на бэкенде при 60 врачах, вынос индекса при 300, фильтр «есть запись», посадочные страницы) описано в разделе «Вне области» спеки.
