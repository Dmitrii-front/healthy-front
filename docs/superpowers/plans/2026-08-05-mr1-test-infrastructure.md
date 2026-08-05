# MR 1: Инфраструктура тестов и типов — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завести в проекте тестовый раннер, вернуть зону `web/` под проверку типов и покрыть тестами существующие чистые функции отображения врача.

**Architecture:** Vitest 4 с отдельным `vitest.config.ts` (официальный `getViteConfig` из Astro здесь падает на плагине Cloudflare). Окружение `node` — все покрываемые функции возвращают данные, DOM не нужен. Тесты лежат рядом с исходниками. Попутно склонение стажа переезжает из frontmatter страницы врача в общий модуль отображения, а `yearsSince` получает инжектируемую «текущую дату», без которой тест на стаж недетерминирован.

**Tech Stack:** Vitest 4, TypeScript 6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), pnpm 11, lefthook 2, oxlint/oxfmt.

**Спека:** `docs/superpowers/specs/2026-08-05-doctors-search-astro-design.md`, раздел 9.

**Это первый из пяти MR.** Он ни от чего не зависит и разблокирует остальные четыре — без раннера в них нельзя писать тесты.

---

## File Structure

| Файл                                                       | Ответственность                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `vitest.config.ts` (создать)                               | Конфигурация раннера: алиас `@`, окружение node, префикс переменных, исключения            |
| `package.json` (изменить)                                  | Зависимость `vitest`, скрипты `test` и `test:watch`                                        |
| `tsconfig.json` (изменить)                                 | `include`: добавить `web/lib` и `vitest.config.ts`, убрать несуществующий `vite.config.ts` |
| `lefthook.yml` (изменить)                                  | Прогон тестов в pre-commit                                                                 |
| `src/entities/doctor/lib/doctor-display.ts` (изменить)     | Добавить `formatExperienceLabel`, добавить параметр `now` в `yearsSince`                   |
| `src/entities/doctor/lib/doctor-display.test.ts` (создать) | Тесты всех чистых функций отображения                                                      |
| `src/entities/doctor/index.ts` (изменить)                  | Экспорт `formatExperienceLabel`                                                            |
| `web/pages/doctor/[id].astro` (изменить)                   | Убрать локальный `pluralYears`, звать общую функцию                                        |
| `web/lib/slug.test.ts` (создать)                           | Тесты слага; заодно доказывают, что раннер видит зону `web/`                               |

---

## Task 1: Поставить vitest и создать конфигурацию

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/package.json`
- Create: `/Users/vladimir/Development/healthy-mobile/vitest.config.ts`

- [ ] **Step 1: Установить vitest**

```bash
cd /Users/vladimir/Development/healthy-mobile
pnpm add -D vitest
```

Ожидается: встанет vitest 4.x. Проверить, что в `package.json` в `devDependencies` появилась строка `"vitest": "^4..."`.

**Важно:** в `package.json` у `@hookform/resolvers` стоит версия `"latest"`, и `pnpm add` может попутно поднять её. Если `git diff package.json` показывает изменение помимо vitest — откатить эту строку вручную, чтобы MR остался про тесты.

- [ ] **Step 2: Создать конфигурацию раннера**

Создать `/Users/vladimir/Development/healthy-mobile/vitest.config.ts`:

```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Отдельный конфиг, а не getViteConfig из astro/config: тот тянет плагин
// Cloudflare, который на старте vitest падает несовместимостью окружения ssr
// (vitest ставит туда resolve.external, плагин это запрещает). Тестируем
// чистые функции, поэтому конвейер Astro здесь и не нужен.
export default defineConfig({
  // Astro раздаёт переменные с префиксом PUBLIC_, у Vite по умолчанию только
  // VITE_. Без этой строки import.meta.env.PUBLIC_API_URL в тестах пуст, а
  // shared/config/env.ts подменяет его значением по умолчанию и молчит.
  envPrefix: ['PUBLIC_'],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'web/**/*.test.ts'],
    // В vitest 4 дефолтный exclude — только node_modules и .git. Вложенные
    // worktree в .claude держат собственные node_modules: прогонять чужую
    // ветку своими зависимостями смысла нет.
    exclude: [...configDefaults.exclude, '**/dist/**', '**/.astro/**', '**/.claude/**'],
  },
})
```

- [ ] **Step 3: Добавить скрипты**

В `package.json` в раздел `scripts` добавить две строки после `"astro": "astro"`:

```json
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
```

- [ ] **Step 4: Проверить, что раннер запускается без тестов**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test
```

Ожидается: `No test files found, exiting with code 0`. Код возврата 0 — именно ради этого стоит `--passWithNoTests`, без него пустой прогон возвращает 1 и уронил бы pre-commit.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "build(test): поднять vitest с отдельным конфигом"
```

---

## Task 2: Вернуть зону web/ под проверку типов

Сейчас `tsconfig.json` перечисляет в `include` файл `vite.config.ts`, которого в проекте нет, а каталог `web` не упомянут вовсе. Следствие: ни `astro check`, ни `tsc -b --noEmit` не проверяют библиотечный код витрины, хотя оба гоняются на каждом коммите.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/tsconfig.json` (последняя строка)

- [ ] **Step 1: Убедиться, что проверка типов сейчас зелёная**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit
```

Ожидается: пусто (успех). Это базовая линия — если тут уже есть ошибки, их надо разобрать до правки `include`, иначе непонятно, что сломала правка.

- [ ] **Step 2: Расширить include**

В `tsconfig.json` заменить последнюю строку.

Было:

```json
  "include": ["src", "vite.config.ts"]
```

Стало:

```json
  "include": ["src", "web/lib", "vitest.config.ts"]
```

Каталог `web` целиком добавлять нельзя: это вскрывает около сотни ошибок в существующих `.astro`-файлах (`web/components/auth/LoginModal.astro`, `web/components/booking/BookingModal.astro` и другие — там `'modal' is possibly 'null'`) и заблокировало бы коммиты всей команде. Разбор `.astro` под строгими типами — отдельная задача.

- [ ] **Step 3: Проверить, что новых ошибок нет**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit && pnpm exec astro check
```

Ожидается: обе команды успешны. Под проверку добавились `web/lib/api.ts`, `auth.ts`, `booking.ts`, `modal.ts`, `slug.ts` — они уже написаны в строгом стиле и ошибок давать не должны.

Если ошибки всё же появились: не расширять `include`, а сузить его до `["src", "web/lib/slug.ts", "vitest.config.ts"]`, зафиксировать это отклонение в описании MR и завести отдельную задачу на разбор остальных файлов. Тесты этого MR требуют в `include` только `slug.ts`.

- [ ] **Step 4: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add tsconfig.json
git commit -m "fix(types): вернуть web/lib под проверку типов

В include числился vite.config.ts, которого в проекте нет, а web/ не
упоминалась вовсе — ошибки в библиотечном коде витрины не ловил ни
astro check, ни tsc на pre-commit."
```

---

## Task 3: Сделать `yearsSince` детерминированной

Функция считает стаж от `new Date()`. Пока «сегодня» берётся внутри, тест на неё либо врёт, либо требует подмены системного времени. Добавляем необязательный параметр — вызывающий код не меняется.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.ts:57-70`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { yearsSince } from './doctor-display'

describe('yearsSince', () => {
  it('считает полные годы от переданной даты', () => {
    expect(yearsSince('1990-12-02', new Date('2026-08-05'))).toBe(35)
  })

  it('не засчитывает неполный год', () => {
    // Ровно день до годовщины — стажа ещё нет.
    expect(yearsSince('2025-08-06', new Date('2026-08-05'))).toBe(0)
    // Годовщина наступила.
    expect(yearsSince('2025-08-05', new Date('2026-08-05'))).toBe(1)
  })

  it('отдаёт ноль для начавших практику в этом году', () => {
    // В проде такие есть: врач с датой начала практики трёхдневной давности.
    expect(yearsSince('2026-08-02', new Date('2026-08-05'))).toBe(0)
  })

  it('отдаёт null для отсутствующей и битой даты', () => {
    expect(yearsSince(null, new Date('2026-08-05'))).toBeNull()
    expect(yearsSince('не дата', new Date('2026-08-05'))).toBeNull()
  })

  it('отдаёт null, если практика начинается в будущем', () => {
    expect(yearsSince('2027-01-01', new Date('2026-08-05'))).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/lib/doctor-display.test.ts
```

Ожидается: провал компиляции типов — `yearsSince` принимает один аргумент, передаётся два (`Expected 1 arguments, but got 2`).

- [ ] **Step 3: Добавить параметр**

В `src/entities/doctor/lib/doctor-display.ts` заменить функцию `yearsSince` целиком:

```ts
/**
 * Стаж из start_practise_date. Неполный год не засчитывается.
 *
 * `now` инжектируется, чтобы функция была детерминированной в тестах;
 * в бою вызывается без второго аргумента.
 */
export function yearsSince(isoDate: string | null, now: Date = new Date()): number | null {
  if (isoDate === null) return null
  const start = new Date(isoDate)
  if (Number.isNaN(start.getTime())) return null

  let years = now.getFullYear() - start.getFullYear()
  const monthDelta = now.getMonth() - start.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < start.getDate())) {
    years -= 1
  }
  return years >= 0 ? years : null
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/lib/doctor-display.test.ts
```

Ожидается: 5 тестов пройдено.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/lib/doctor-display.ts src/entities/doctor/lib/doctor-display.test.ts
git commit -m "test(doctor): покрыть yearsSince и сделать её детерминированной"
```

---

## Task 4: Перенести склонение стажа в общий модуль

Склонение лет живёт во frontmatter `web/pages/doctor/[id].astro` (функция `pluralYears`). Карточкам выдачи оно тоже понадобится — переносим в общий модуль, добавляя правило для нулевого стажа.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.ts`
- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/index.ts`
- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/doctor/[id].astro`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.test.ts`

- [ ] **Step 1: Написать падающий тест**

Дописать в `src/entities/doctor/lib/doctor-display.test.ts` — добавить `formatExperienceLabel` в существующий импорт из `./doctor-display` и добавить блок в конец файла:

```ts
describe('formatExperienceLabel', () => {
  it('показывает нулевой стаж словами, а не «0 лет»', () => {
    expect(formatExperienceLabel(0)).toBe('Менее года')
  })

  it('склоняет годы по-русски', () => {
    expect(formatExperienceLabel(1)).toBe('1 год')
    expect(formatExperienceLabel(2)).toBe('2 года')
    expect(formatExperienceLabel(4)).toBe('4 года')
    expect(formatExperienceLabel(5)).toBe('5 лет')
    expect(formatExperienceLabel(20)).toBe('20 лет')
    expect(formatExperienceLabel(21)).toBe('21 год')
    expect(formatExperienceLabel(22)).toBe('22 года')
    expect(formatExperienceLabel(25)).toBe('25 лет')
    expect(formatExperienceLabel(32)).toBe('32 года')
  })

  it('не сбивается на числах второго десятка', () => {
    // 11-14 — исключение из правила: «одиннадцать лет», а не «одиннадцать год».
    expect(formatExperienceLabel(11)).toBe('11 лет')
    expect(formatExperienceLabel(12)).toBe('12 лет')
    expect(formatExperienceLabel(14)).toBe('14 лет')
    expect(formatExperienceLabel(111)).toBe('111 лет')
  })

  it('отдаёт null, когда стаж неизвестен — строку рисовать нечем', () => {
    expect(formatExperienceLabel(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/lib/doctor-display.test.ts
```

Ожидается: провал — `formatExperienceLabel` не экспортируется из `./doctor-display`.

- [ ] **Step 3: Реализовать функцию**

Дописать в конец `src/entities/doctor/lib/doctor-display.ts`:

```ts
/**
 * Подпись стажа для карточки и профиля.
 *
 * Ноль — не «0 лет»: у врача, начавшего практику в этом году, стажа
 * действительно нет, но такая подпись читается как ошибка данных.
 */
export function formatExperienceLabel(years: number | null): string | null {
  if (years === null) return null
  if (years === 0) return 'Менее года'

  const m10 = years % 10
  const m100 = years % 100
  const noun =
    m10 === 1 && m100 !== 11
      ? 'год'
      : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)
        ? 'года'
        : 'лет'

  return `${years} ${noun}`
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/lib/doctor-display.test.ts
```

Ожидается: 9 тестов пройдено.

- [ ] **Step 5: Экспортировать функцию из слайса**

В `src/entities/doctor/index.ts` заменить строку

```ts
export { formatPriceKgs } from './lib/doctor-display'
```

на

```ts
export { formatExperienceLabel, formatPriceKgs } from './lib/doctor-display'
```

- [ ] **Step 6: Перевести страницу врача на общую функцию**

В `web/pages/doctor/[id].astro` в строке импорта заменить

```ts
import { searchDoctors, getDoctorProfile, formatPriceKgs } from '@/entities/doctor'
```

на

```ts
import {
  searchDoctors,
  getDoctorProfile,
  formatPriceKgs,
  formatExperienceLabel,
} from '@/entities/doctor'
```

Затем удалить локальную функцию целиком (frontmatter, сразу после комментария «Display helpers»):

```ts
function pluralYears(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'год'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'года'
  return 'лет'
}
```

- [ ] **Step 7: Заменить все обращения к удалённой функции**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'pluralYears' 'web/pages/doctor/[id].astro'
```

Каждое найденное место переписать на `formatExperienceLabel`. Типичное выражение вида `` `${doctor.yearsExperience} ${pluralYears(doctor.yearsExperience)}` `` заменяется на `formatExperienceLabel(doctor.yearsExperience)`, а окружающая проверка `doctor.yearsExperience !== null` — на проверку результата: функция сама возвращает `null`, когда рисовать нечего.

После правки команда `grep -n 'pluralYears' 'web/pages/doctor/[id].astro'` не должна находить ничего.

- [ ] **Step 8: Проверить типы и сборку страницы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec astro check && pnpm exec tsc -b --noEmit
```

Ожидается: обе команды успешны.

- [ ] **Step 9: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/lib/doctor-display.ts src/entities/doctor/lib/doctor-display.test.ts src/entities/doctor/index.ts "web/pages/doctor/[id].astro"
git commit -m "refactor(doctor): вынести склонение стажа в общий модуль отображения

Карточкам выдачи оно понадобится тоже, а нулевой стаж теперь
показывается как «Менее года»: в каталоге есть врачи, начавшие
практику в этом году."
```

---

## Task 5: Покрыть остальные функции отображения

**Files:**

- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/lib/doctor-display.test.ts`

- [ ] **Step 1: Дописать тесты**

Расширить импорт в `src/entities/doctor/lib/doctor-display.test.ts` до полного набора:

```ts
import {
  avatarColorFor,
  buildFullName,
  buildInitials,
  buildShortName,
  formatExperienceLabel,
  formatLanguages,
  formatPriceKgs,
  normalizeSpecialization,
  yearsSince,
} from './doctor-display'
```

и добавить блоки в конец файла:

```ts
describe('formatLanguages', () => {
  it('разворачивает ISO-коды в самоназвания', () => {
    expect(formatLanguages(['ru', 'ky', 'en'])).toEqual(['Русский', 'Кыргызча', 'English'])
  })

  it('не теряет незнакомый код, а поднимает его в верхний регистр', () => {
    expect(formatLanguages(['de'])).toEqual(['DE'])
  })

  it('не спотыкается о регистр входа', () => {
    expect(formatLanguages(['RU'])).toEqual(['Русский'])
  })

  it('отдаёт пустой список для пустого входа', () => {
    expect(formatLanguages([])).toEqual([])
  })
})

describe('formatPriceKgs', () => {
  it('форматирует цену с разрядами и сомом', () => {
    // Неразрывный пробел из Intl — сравниваем через регулярку, чтобы тест не
    // падал из-за невидимого символа.
    expect(formatPriceKgs(1000)).toMatch(/^1\s000 с$/u)
    expect(formatPriceKgs(2999)).toMatch(/^2\s999 с$/u)
  })

  it('отдаёт null, когда цены нет', () => {
    expect(formatPriceKgs(null)).toBeNull()
  })
})

describe('normalizeSpecialization', () => {
  it('поднимает первую букву: в базе встречается и «стоматолог», и «Стоматолог»', () => {
    expect(normalizeSpecialization('стоматолог')).toBe('Стоматолог')
    expect(normalizeSpecialization('Стоматолог')).toBe('Стоматолог')
  })

  it('не трогает остальные буквы, чтобы не сломать аббревиатуры', () => {
    expect(normalizeSpecialization('врач УЗИ')).toBe('Врач УЗИ')
  })

  it('обрезает пробелы и переживает пустую строку', () => {
    expect(normalizeSpecialization('  хирург  ')).toBe('Хирург')
    expect(normalizeSpecialization('')).toBe('')
    expect(normalizeSpecialization('   ')).toBe('')
  })
})

describe('buildInitials', () => {
  it('берёт первые буквы фамилии и имени', () => {
    expect(buildInitials('Надточий', 'Дмитрий')).toBe('НД')
  })

  it('переживает пустое имя', () => {
    expect(buildInitials('Иванов', '')).toBe('И')
  })

  it('отдаёт прочерк, когда имени нет вовсе — карточке нужен хоть какой-то знак', () => {
    expect(buildInitials('', '')).toBe('—')
  })
})

describe('buildShortName и buildFullName', () => {
  it('короткое имя — фамилия и имя', () => {
    expect(buildShortName('Петров', 'Пётр')).toBe('Петров Пётр')
  })

  it('полное имя добавляет отчество, когда оно есть', () => {
    expect(buildFullName('Петров', 'Пётр', 'Петрович')).toBe('Петров Пётр Петрович')
  })

  it('полное имя не оставляет висящий пробел без отчества', () => {
    expect(buildFullName('Петров', 'Пётр', null)).toBe('Петров Пётр')
  })
})

describe('avatarColorFor', () => {
  it('даёт один и тот же цвет одному и тому же врачу', () => {
    const id = '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0'
    expect(avatarColorFor(id)).toBe(avatarColorFor(id))
  })

  it('выдаёт цвет из палитры, а не произвольную строку', () => {
    const palette = ['#E8D5C4', '#D8E3DC', '#E5DCEA', '#DCE5EE', '#EFE3D0', '#DDE7E3']
    expect(palette).toContain(avatarColorFor('какой-угодно-id'))
  })

  it('переживает пустой id', () => {
    expect(typeof avatarColorFor('')).toBe('string')
  })
})
```

- [ ] **Step 2: Запустить тесты**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/lib/doctor-display.test.ts
```

Ожидается: все тесты проходят (примерно 26 штук).

Если тест на `formatPriceKgs` падает из-за пробела — это ожидаемая ловушка `Intl.NumberFormat`, он вставляет неразрывный пробел U+00A0. Регулярка `\s` в тесте его покрывает; если падает всё равно, проверить фактическое значение через `console.log(JSON.stringify(formatPriceKgs(1000)))` и поправить ожидание, а не саму функцию.

- [ ] **Step 3: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/lib/doctor-display.test.ts
git commit -m "test(doctor): покрыть функции отображения врача"
```

---

## Task 6: Покрыть слаг и проверить, что раннер видит зону web/

Тесты в `web/` важны отдельно: `steiger` туда не смотрит, `tsconfig` до Task 2 тоже не смотрел, и легко получить каталог, который молча не проверяется ничем.

**Files:**

- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/slug.test.ts`

- [ ] **Step 1: Написать тест**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { doctorSlug, slugify } from './slug'

describe('slugify', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Надточий Дмитрий')).toBe('nadtochiy-dmitriy')
  })

  it('передаёт щ, ё, ю, я многобуквенными сочетаниями', () => {
    expect(slugify('Щёткин')).toBe('schyotkin')
    expect(slugify('Юлия Яковлева')).toBe('yuliya-yakovleva')
  })

  it('выбрасывает мягкий и твёрдый знак', () => {
    expect(slugify('Ильясов')).toBe('ilyasov')
    expect(slugify('Объедков')).toBe('obedkov')
  })

  it('схлопывает разделители и не оставляет их по краям', () => {
    expect(slugify('  Пётр   Петров-Водкин  ')).toBe('pyotr-petrov-vodkin')
  })

  it('отдаёт пустую строку, когда транслитерировать нечего', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })
})

describe('doctorSlug', () => {
  const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

  it('склеивает транслитерированное имя с идентификатором', () => {
    expect(doctorSlug({ id, name: 'Иванов Иван' })).toBe(`ivanov-ivan-${id}`)
  })

  it('падает обратно на голый идентификатор, если имя не транслитерируется', () => {
    // Иначе слаг начнётся с дефиса и путь получится битым.
    expect(doctorSlug({ id, name: '???' })).toBe(id)
  })

  it('оставляет идентификатор в конце — по нему страница врача находит запись', () => {
    expect(doctorSlug({ id, name: 'Петров Пётр' }).endsWith(id)).toBe(true)
  })
})
```

- [ ] **Step 2: Запустить тест**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/slug.test.ts
```

Ожидается: 8 тестов пройдено. Если раннер сообщает `No test files found` — значит в `vitest.config.ts` потерялся паттерн `web/**/*.test.ts`.

Если падает тест на `Щёткин` или `Объедков` — сверить ожидание с таблицей `CYRILLIC_MAP` в `web/lib/slug.ts` и поправить **тест**, а не таблицу: слаги уже проиндексированы, менять их правила в этом MR нельзя.

- [ ] **Step 3: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/slug.test.ts
git commit -m "test(slug): покрыть транслитерацию и сборку слага врача"
```

---

## Task 7: Включить тесты в pre-commit

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/lefthook.yml`

- [ ] **Step 1: Добавить команду**

В `lefthook.yml` в блок `pre-commit.commands` добавить пятую команду:

```yaml
test:
  glob: '*.{ts,tsx}'
  run: pnpm exec vitest run --passWithNoTests
```

Итоговый файл:

```yaml
pre-commit:
  parallel: true
  commands:
    format:
      glob: '*.{ts,tsx,js,jsx,json,css,md}'
      run: pnpm exec oxfmt --check {staged_files}
    lint:
      run: pnpm exec oxlint --type-aware
    fsd:
      run: pnpm exec steiger ./src
    typecheck:
      run: pnpm exec tsc -b --noEmit
    test:
      glob: '*.{ts,tsx}'
      run: pnpm exec vitest run --passWithNoTests
```

- [ ] **Step 2: Прогнать хук целиком**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec lefthook run pre-commit --force
```

Ожидается: все пять команд зелёные. Прогон тестов занимает около трёх секунд и идёт параллельно с остальными — дольше всё равно работает `typecheck`.

- [ ] **Step 3: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add lefthook.yml
git commit -m "build(test): гонять тесты на pre-commit"
```

---

## Task 8: Финальная проверка MR

- [ ] **Step 1: Прогнать все проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm fsd
```

Ожидается: всё зелёное. Тестов около 34 в двух файлах.

- [ ] **Step 2: Убедиться, что витрина по-прежнему собирается**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build
```

Ожидается: сборка проходит. Она ходит в живой API за каталогом — если API недоступен, сборка упадёт с сообщением про каталог врачей, и это не дефект этого MR.

- [ ] **Step 3: Проверить, что страница врача не потеряла стаж**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -rn 'Стаж' dist/client/doctor/ | head -3
```

Ожидается: подписи вида «Стаж 32 года» присутствуют. Для врача, начавшего практику в этом году, ожидается «Менее года» — проверить глазами страницу такого врача (в каталоге их двое).

---

## Готовность MR

- [ ] Раннер поднят, `pnpm test` работает
- [ ] `web/lib` под проверкой типов, `tsconfig.include` больше не ссылается на несуществующий файл
- [ ] Склонение стажа живёт в одном месте, нулевой стаж читается как «Менее года»
- [ ] Тесты гоняются на pre-commit
- [ ] Витрина собирается, страница врача не изменилась визуально

**Следующий MR:** `2026-08-05-mr2-catalog-loader.md` — общий загрузчик каталога и устойчивость сборки.
