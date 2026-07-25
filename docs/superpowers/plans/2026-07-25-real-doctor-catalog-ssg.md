# Реальный каталог врачей на главной и странице врача — план реализации

> **Для агентов:** план исполняется задача за задачей. Шаги помечены чекбоксами (`- [ ]`).

**Спека:** [docs/superpowers/specs/2026-07-25-real-doctor-catalog-ssg-design.md](../specs/2026-07-25-real-doctor-catalog-ssg-design.md)

**Цель:** заменить `DOCTOR_MOCKS` на реальный каталог с `https://api.sdoctorom.health`
на главной и на странице врача, оставив SPA и страницу поиска нетронутыми.

**Архитектура:** данные тянутся на сборке (SSG). В `src/entities/doctor/` появляются
новые функции `searchDoctors()` и `getDoctorProfile()` рядом с существующим
`getDoctors()`, который остаётся на моках — его потребляют пять экранов SPA.
Astro-страницы вызывают новые функции во frontmatter и в `getStaticPaths`.

**Стек:** Astro 7 (`output: 'static'`), zod 4, TypeScript 6 strict
(`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), oxlint + oxfmt, pnpm.

**Тестового раннера в проекте нет.** Вместо прогона тестов каждая задача проверяется
`astro check` + `tsc -b`, а задачи со страницами — ещё и `astro build`, который на
самом деле ходит в прод-API. Чистые функции вынесены отдельно, чтобы их можно было
покрыть, когда раннер появится.

---

## Карта файлов

**Создать:**

| Файл                                             | Ответственность                                      |
| ------------------------------------------------ | ---------------------------------------------------- |
| `.env`                                           | `PUBLIC_API_URL` для локальной сборки (гитигнорится) |
| `.env.example`                                   | образец для свежего клона                            |
| `src/entities/doctor/model/doctor-api.schema.ts` | zod-схемы ответов бэкенда                            |
| `src/entities/doctor/model/doctor-view.ts`       | типы для UI + мапперы из API-схем                    |
| `src/entities/doctor/lib/doctor-display.ts`      | чистые хелперы отображения                           |
| `src/entities/doctor/api/search-doctors.ts`      | `searchDoctors()`                                    |
| `src/entities/doctor/api/get-doctor-profile.ts`  | `getDoctorProfile(id)`                               |

**Изменить:**

| Файл                           | Что                                        |
| ------------------------------ | ------------------------------------------ |
| `.gitignore`                   | добавить `.env`                            |
| `src/entities/doctor/index.ts` | реэкспорты новых функций и типов           |
| `web/pages/index.astro`        | обе реализации главной на реальные данные  |
| `web/pages/doctor/[id].astro`  | `getStaticPaths` и тело на реальные данные |

**Не трогаем:** `src/entities/doctor/api/get-doctors.ts`, `get-doctor-by-id.ts`,
`mock/doctors.mock.ts`, `model/schema.ts`, `model/types.ts`, `web/pages/search.astro`,
`astro.config.mjs`, всё в `src/pages/`.

---

## Task 1: Переменная окружения

**Файлы:**

- Создать: `.env`, `.env.example`
- Изменить: `.gitignore`

- [ ] **Шаг 1: Создать `.env.example`**

```
# Базовый URL NestJS-бэкенда. Astro-сборка ходит сюда за каталогом врачей.
PUBLIC_API_URL=https://api.sdoctorom.health
```

- [ ] **Шаг 2: Создать `.env` с тем же содержимым**

Тот же текст, что и в `.env.example`. Значение публичное, не секрет, но файл
гитигнорится, чтобы разработчик мог переключиться на локальный бэкенд, не трогая
репозиторий.

- [ ] **Шаг 3: Добавить `.env` в `.gitignore`**

В `.gitignore` после строки `.idea` вставить:

```
.env
```

- [ ] **Шаг 4: Проверить, что переменная читается**

Запустить: `pnpm exec astro check`
Ожидается: без новых ошибок. `src/shared/config/env.ts` уже парсит
`import.meta.env.PUBLIC_API_URL` через zod, менять его не нужно.

- [ ] **Шаг 5: Коммит**

```bash
git add .env.example .gitignore
git commit -m "chore(config): add PUBLIC_API_URL env template"
```

---

## Task 2: zod-схемы ответов бэкенда

**Файлы:**

- Создать: `src/entities/doctor/model/doctor-api.schema.ts`

- [ ] **Шаг 1: Написать схемы**

```ts
import { z } from 'zod'

/**
 * price_from приходит числом из /doctor-profile/search (там его прогоняют через
 * Number() в toDtoFromRow) и строкой "1000.00" из /doctor-profile/:id (TypeORM
 * отдаёт decimal строкой). rating — та же история. Принимаем оба варианта и
 * гасим мусор в null, чтобы NaN не утёк в разметку.
 */
const numericNullable = z
  .union([z.number(), z.string()])
  .transform((value) => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  })
  .nullable()

/** Элемент выдачи GET /doctor-profile/search. */
export const DoctorSearchItemSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  middle_name: z.string().nullable().default(null),
  avatar_url: z.string().nullable().default(null),
  specialization: z.string(),
  primary_work_city: z.string().nullable().default(null),
  price_from: numericNullable.default(null),
  languages: z.array(z.string()).nullable().default(null),
})

/**
 * items намеренно z.unknown(): элементы валидируются поштучно в searchDoctors,
 * чтобы один битый врач не обнулял весь каталог.
 */
export const DoctorSearchResponseSchema = z.object({
  status: z.string(),
  payload: z.object({
    items: z.array(z.unknown()),
    nextCursor: z.string().nullable().default(null),
  }),
})

/** Место работы в публичном профиле врача (уже прошло toPublicWorkplace на бэке). */
export const PublicWorkplaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
  description: z.string().nullable().default(null),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable().default(null),
  map_image_url: z.string().nullable().default(null),
})

/**
 * GET /doctor-profile/:id отдаёт сырую сущность, а не урезанный DoctorDto,
 * поэтому полей заметно больше, чем в поиске.
 */
export const DoctorProfileSchema = DoctorSearchItemSchema.extend({
  bio: z.string().nullable().default(null),
  start_practise_date: z.string().nullable().default(null),
  education: z.string().nullable().default(null),
  schedule_note: z.string().nullable().default(null),
  subspecializations: z.array(z.string()).nullable().default(null),
  rating: numericNullable.default(null),
  reviews_count: z.number().default(0),
  workplaces: z.array(PublicWorkplaceSchema).default([]),
})

export const DoctorProfileResponseSchema = z.object({
  status: z.string(),
  payload: DoctorProfileSchema,
})

export type DoctorSearchItemDto = z.infer<typeof DoctorSearchItemSchema>
export type DoctorProfileDto = z.infer<typeof DoctorProfileSchema>
export type PublicWorkplaceDto = z.infer<typeof PublicWorkplaceSchema>
```

- [ ] **Шаг 2: Проверить типы**

Запустить: `pnpm exec tsc -b --noEmit`
Ожидается: без ошибок.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/model/doctor-api.schema.ts
git commit -m "feat(doctor): add zod schemas for backend doctor endpoints"
```

---

## Task 3: Чистые хелперы отображения

**Файлы:**

- Создать: `src/entities/doctor/lib/doctor-display.ts`

- [ ] **Шаг 1: Написать хелперы**

```ts
/**
 * Чистые функции без побочных эффектов и без обращений к сети.
 * Вынесены отдельно, чтобы покрыть тестами, как только в проекте появится раннер.
 */

/** Подложки аватара. Фото у врачей нет, поэтому инициалы всегда на цветном фоне. */
const AVATAR_COLORS = ['#E8D5C4', '#D8E3DC', '#E5DCEA', '#DCE5EE', '#EFE3D0', '#DDE7E3'] as const

/**
 * Детерминированный цвет по id: один и тот же врач всегда одного цвета,
 * а лента не выглядит монотонной.
 */
export function avatarColorFor(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export function buildInitials(lastName: string, firstName: string): string {
  const first = lastName.trim().charAt(0).toUpperCase()
  const second = firstName.trim().charAt(0).toUpperCase()
  const initials = `${first}${second}`
  return initials.length > 0 ? initials : '—'
}

export function buildShortName(lastName: string, firstName: string): string {
  return [lastName, firstName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export function buildFullName(
  lastName: string,
  firstName: string,
  middleName: string | null,
): string {
  return [lastName, firstName, middleName ?? '']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Специализация на бэке — свободный текст с разнобоем регистра
 * («стоматолог» против «Стоматолог»). Поднимаем первую букву, остальное не трогаем,
 * чтобы не сломать аббревиатуры.
 */
export function normalizeSpecialization(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/** Стаж из start_practise_date. Неполный год не засчитывается. */
export function yearsSince(isoDate: string | null): number | null {
  if (isoDate === null) return null
  const start = new Date(isoDate)
  if (Number.isNaN(start.getTime())) return null

  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  const monthDelta = now.getMonth() - start.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < start.getDate())) {
    years -= 1
  }
  return years >= 0 ? years : null
}

const priceFormatter = new Intl.NumberFormat('ru-RU')

/**
 * Валюты в API нет. Все врачи каталога — Кыргызстан, поэтому сом.
 * Когда бэкенд отдаст currency, менять только здесь.
 */
export function formatPriceKgs(value: number | null): string | null {
  if (value === null) return null
  return `${priceFormatter.format(value)} с`
}
```

- [ ] **Шаг 2: Проверить типы и линт**

Запустить: `pnpm exec tsc -b --noEmit && pnpm exec oxlint --type-aware`
Ожидается: без ошибок. Если oxlint ругнётся на `>>> 0`, это ожидаемая
беззнаковая нормализация хеша — не убирать, она не даёт индексу уйти в минус.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/lib/doctor-display.ts
git commit -m "feat(doctor): add pure display helpers for real catalog data"
```

---

## Task 4: Типы для UI и мапперы

**Файлы:**

- Создать: `src/entities/doctor/model/doctor-view.ts`

- [ ] **Шаг 1: Написать типы и мапперы**

```ts
import {
  avatarColorFor,
  buildFullName,
  buildInitials,
  buildShortName,
  normalizeSpecialization,
  yearsSince,
} from '../lib/doctor-display'
import type { DoctorProfileDto, DoctorSearchItemDto } from './doctor-api.schema'

/**
 * Отдельный тип, а не существующий Doctor из model/types.ts: у того обязательные
 * clinic, color и initials, которых в выдаче поиска нет — пришлось бы выдумывать
 * клинику. Doctor остаётся мок-типом для экранов SPA.
 */
export interface DoctorListItem {
  id: string
  shortName: string
  fullName: string
  initials: string
  avatarColor: string
  specialization: string
  city: string | null
  priceFrom: number | null
  languages: string[]
  avatarUrl: string | null
}

export interface DoctorWorkplaceView {
  id: string
  name: string
  address: string
  description: string | null
  coordinates: { lat: number; lng: number } | null
  mapImageUrl: string | null
}

export interface DoctorProfileView extends DoctorListItem {
  bio: string | null
  education: string | null
  scheduleNote: string | null
  subspecializations: string[]
  yearsExperience: number | null
  rating: number | null
  reviewsCount: number
  workplaces: DoctorWorkplaceView[]
}

export function toDoctorListItem(dto: DoctorSearchItemDto): DoctorListItem {
  return {
    id: dto.id,
    shortName: buildShortName(dto.last_name, dto.first_name),
    fullName: buildFullName(dto.last_name, dto.first_name, dto.middle_name),
    initials: buildInitials(dto.last_name, dto.first_name),
    avatarColor: avatarColorFor(dto.id),
    specialization: normalizeSpecialization(dto.specialization),
    city: dto.primary_work_city,
    priceFrom: dto.price_from,
    languages: dto.languages ?? [],
    avatarUrl: dto.avatar_url,
  }
}

export function toDoctorProfileView(dto: DoctorProfileDto): DoctorProfileView {
  return {
    ...toDoctorListItem(dto),
    bio: dto.bio,
    education: dto.education,
    scheduleNote: dto.schedule_note,
    subspecializations: dto.subspecializations ?? [],
    yearsExperience: yearsSince(dto.start_practise_date),
    rating: dto.rating,
    reviewsCount: dto.reviews_count,
    workplaces: dto.workplaces.map((workplace) => ({
      id: workplace.id,
      name: workplace.name,
      address: workplace.address,
      description: workplace.description,
      coordinates: workplace.coordinates,
      mapImageUrl: workplace.map_image_url,
    })),
  }
}
```

- [ ] **Шаг 2: Проверить типы**

Запустить: `pnpm exec tsc -b --noEmit`
Ожидается: без ошибок.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/model/doctor-view.ts
git commit -m "feat(doctor): add view types and mappers for real catalog"
```

---

## Task 5: `searchDoctors()`

**Файлы:**

- Создать: `src/entities/doctor/api/search-doctors.ts`

- [ ] **Шаг 1: Написать функцию**

```ts
import { env } from '@/shared/config'

import { DoctorSearchItemSchema, DoctorSearchResponseSchema } from '../model/doctor-api.schema'
import { toDoctorListItem, type DoctorListItem } from '../model/doctor-view'

/** Бэкенд ограничивает limit сотней. */
const PAGE_SIZE = 100
/** Страховка от битого курсора: без неё цикл может не закончиться никогда. */
const MAX_PAGES = 50

/**
 * Весь каталог верифицированных врачей. Вызывается ТОЛЬКО на сборке (SSG) —
 * из frontmatter главной и из getStaticPaths страницы врача.
 *
 * Бросает при недоступном API и при пустом каталоге: лучше не задеплоиться,
 * чем выкатить витрину без врачей поверх того, что уже проиндексировано.
 */
export async function searchDoctors(): Promise<DoctorListItem[]> {
  const doctors: DoctorListItem[] = []
  let cursor: string | null = null
  let dropped = 0

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('/doctor-profile/search', env.API_URL)
    url.searchParams.set('limit', String(PAGE_SIZE))
    if (cursor !== null) url.searchParams.set('cursor', cursor)

    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(
        `Каталог врачей недоступен: ${response.status} ${response.statusText}. ` +
          `Запрошен ${url.toString()}. Проверьте PUBLIC_API_URL.`,
      )
    }

    const parsed = DoctorSearchResponseSchema.safeParse(await response.json())
    if (!parsed.success) {
      throw new Error(`Каталог врачей вернул неожиданную структуру: ${parsed.error.message}`)
    }

    // Поштучно: один врач с битым полем не должен обнулять весь каталог.
    for (const raw of parsed.data.payload.items) {
      const item = DoctorSearchItemSchema.safeParse(raw)
      if (item.success) doctors.push(toDoctorListItem(item.data))
      else dropped += 1
    }

    cursor = parsed.data.payload.nextCursor
    if (cursor === null) break
  }

  if (dropped > 0) {
    console.warn(`[doctors] отброшено записей, не прошедших валидацию: ${dropped}`)
  }

  if (doctors.length === 0) {
    throw new Error(
      'Каталог врачей пуст. Сборка остановлена, чтобы не выкатить витрину без врачей.',
    )
  }

  return doctors
}
```

- [ ] **Шаг 2: Проверить типы и линт**

Запустить: `pnpm exec tsc -b --noEmit && pnpm exec oxlint --type-aware`
Ожидается: без ошибок.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/api/search-doctors.ts
git commit -m "feat(doctor): fetch real doctor catalog from backend"
```

---

## Task 6: `getDoctorProfile()`

**Файлы:**

- Создать: `src/entities/doctor/api/get-doctor-profile.ts`

- [ ] **Шаг 1: Написать функцию**

```ts
import { env } from '@/shared/config'

import { DoctorProfileResponseSchema } from '../model/doctor-api.schema'
import { toDoctorProfileView, type DoctorProfileView } from '../model/doctor-view'

/**
 * Полный публичный профиль врача. В отличие от выдачи поиска содержит стаж,
 * образование, рейтинг и места работы.
 *
 * Возвращает null, если врача нет или ответ не прошёл валидацию — вызывающая
 * страница в этом случае пропускает врача, а не роняет сборку: каталог уже
 * подтверждён поиском, единичный сбой профиля не повод не деплоиться.
 */
export async function getDoctorProfile(id: string): Promise<DoctorProfileView | null> {
  const url = new URL(`/doctor-profile/${id}`, env.API_URL)

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) {
    console.warn(`[doctors] профиль ${id} недоступен: ${response.status} ${response.statusText}`)
    return null
  }

  const parsed = DoctorProfileResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    console.warn(`[doctors] профиль ${id} не прошёл валидацию: ${parsed.error.message}`)
    return null
  }

  return toDoctorProfileView(parsed.data.payload)
}
```

- [ ] **Шаг 2: Проверить типы и линт**

Запустить: `pnpm exec tsc -b --noEmit && pnpm exec oxlint --type-aware`
Ожидается: без ошибок.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/api/get-doctor-profile.ts
git commit -m "feat(doctor): fetch public doctor profile from backend"
```

---

## Task 7: Публичный API слайса

**Файлы:**

- Изменить: `src/entities/doctor/index.ts`

- [ ] **Шаг 1: Дописать реэкспорты**

Текущее содержимое сохранить целиком, добавить снизу:

```ts
export { searchDoctors } from './api/search-doctors'
export { getDoctorProfile } from './api/get-doctor-profile'
export type { DoctorListItem, DoctorProfileView, DoctorWorkplaceView } from './model/doctor-view'
export { formatPriceKgs } from './lib/doctor-display'
```

Только именованные реэкспорты, никаких `export *` — правило из `CLAUDE.md`.

- [ ] **Шаг 2: Убедиться, что SPA не сломался**

Запустить: `pnpm exec tsc -b --noEmit && pnpm exec steiger ./src`
Ожидается: без ошибок. Критично: `getDoctors()` и `DOCTOR_QUERIES` не менялись,
поэтому `src/pages/home`, `visits`, `visit-detail`, `profile` должны продолжать
компилироваться без правок. Если появились ошибки в `src/pages/*` — значит что-то
задели в старом коде, откатить и разобраться.

- [ ] **Шаг 3: Коммит**

```bash
git add src/entities/doctor/index.ts
git commit -m "feat(doctor): expose real catalog API through slice barrel"
```

---

## Task 8: Главная — мобильная реализация (`.mw-shell`)

**Файлы:**

- Изменить: `web/pages/index.astro` (frontmatter ~строки 6, 114–119; разметка ~330–420)

- [ ] **Шаг 1: Заменить источник данных во frontmatter**

Убрать строку 6:

```astro
import { DOCTOR_MOCKS } from "@/entities/doctor/mock/doctors.mock";
```

Добавить вместо неё:

```astro
import { searchDoctors, formatPriceKgs } from "@/entities/doctor";
```

Убрать строки 114–119 (`onlineDoctors` и `nearbyDoctors`) и вставить:

```astro
// Весь каталог верифицированных врачей, вшивается в HTML на сборке.
// Одна лента вместо двух: признака «онлайн/в клинике» в данных нет —
// consultation_formats у всех прод-врачей null.
const doctors = await searchDoctors();
```

- [ ] **Шаг 2: Удалить мок-фотографии**

Удалить объявление `DOCTOR_PHOTOS` (начинается на строке 133) целиком и все ссылки
на него. Фото нет ни у одного реального врача — вместо `<img>` рендерим инициалы.

Функцию `pluralizeDoctor` оставить: она пригодится для подписи количества.

- [ ] **Шаг 3: Заменить первую ленту, вторую удалить**

Секцию с `{onlineDoctors.map(...)}` (~строка 331) заменить на ленту по `doctors`,
карточка — по разметке ниже. Секцию с `{nearbyDoctors.map(...)}` (~строка 382)
удалить целиком вместе с её `<div class="mw-section-head">`.

Карточка:

```astro
{doctors.map((d) => (
  <a href={`/doctor/${doctorSlug({ id: d.id, name: d.fullName })}`} class="mw-doctor-card tap">
    <div class="mw-doctor-head">
      <div class="mw-avatar-wrap">
        {d.avatarUrl ? (
          <img class="mw-avatar mw-avatar-img" src={d.avatarUrl} alt={d.shortName}
               loading="lazy" decoding="async" width="44" height="44" />
        ) : (
          <span class="mw-avatar mw-avatar-initials" style={`background-color:${d.avatarColor}`}>
            {d.initials}
          </span>
        )}
      </div>
      <div class="mw-doctor-titles">
        <span class="mw-doctor-name">{d.shortName}</span>
        <span class="mw-doctor-spec">{d.specialization}</span>
      </div>
    </div>
    {d.city && <div class="mw-doctor-meta"><span class="mw-doctor-muted">{d.city}</span></div>}
    <div class="mw-doctor-cta-row">
      {formatPriceKgs(d.priceFrom)
        ? <span class="mw-doctor-price">от <strong>{formatPriceKgs(d.priceFrom)}</strong></span>
        : <span />}
      <span class="mw-book-btn">Записаться</span>
    </div>
  </a>
))}
```

Пустой `<span />` в ветке без цены нужен, чтобы `justify-content: space-between`
не прижал кнопку влево.

- [ ] **Шаг 4: Добавить стиль инициалов**

В блок `<style is:global>` рядом с остальными `.mw-*` правилами:

```css
.mw-avatar-initials {
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  color: #0f1115;
}
.mw-doctor-name,
.mw-doctor-spec {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Обрезка обязательна: в проде есть врач с субспециализациями
`["а","бб","ввв","гггг","ддддд"]` и мусорными строками — вёрстка не должна ехать.

- [ ] **Шаг 5: Проверить сборку**

Запустить: `pnpm exec astro build`
Ожидается: сборка проходит, в логе нет `[doctors] отброшено`. При недоступном API
сборка обязана упасть с сообщением про `PUBLIC_API_URL` — это правильное поведение.

- [ ] **Шаг 6: Коммит**

```bash
git add web/pages/index.astro
git commit -m "feat(home): render real doctors in mobile layout"
```

---

## Task 9: Главная — десктопная реализация (`.dw-page`)

**Файлы:**

- Изменить: `web/pages/index.astro` (разметка ~519, ~729–780)

Десктоп — независимая реализация той же страницы, переключаемая CSS на 768px
(`.dw-page { display: none }` ниже брейкпоинта). Правки Task 8 её не затронули.

- [ ] **Шаг 1: Перевести стопку аватаров в hero**

Блок на ~519 строке (`nearbyDoctors.slice(0, 6).map(...)` с `<img src={nearbyAvatars[i]}>`)
заменить на:

```astro
{doctors.slice(0, 6).map((d) => (
  <span class="dw-stack-avatar dw-stack-avatar-initials"
        style={`background-color:${d.avatarColor}`} title={d.fullName}>
    {d.initials}
  </span>
))}
```

Объявление `nearbyAvatars` после этого станет неиспользуемым — удалить его.

Маркетинговые числа рядом («+192», «192 врача доступны прямо сейчас», «Более 2 000
проверенных специалистов») **оставить как есть**: это копирайт, а не данные, и он был
неточен уже на моках. Менять его — отдельное решение владельца продукта.

- [ ] **Шаг 2: Перевести карусель «По записи в клинику»**

Блок `{nearbyDoctors.map(...)}` (~строка 744) заменить на:

```astro
{doctors.map((d) => (
  <a href={`/doctor/${doctorSlug({ id: d.id, name: d.fullName })}`} class="dw-doctor dw-doctor-slide">
    <div class="dw-doctor-head">
      {d.avatarUrl ? (
        <img class="dw-doctor-avatar dw-doctor-avatar-img" src={d.avatarUrl} alt={d.shortName}
             loading="lazy" decoding="async" width="56" height="56" />
      ) : (
        <span class="dw-doctor-avatar dw-doctor-avatar-initials"
              style={`background-color:${d.avatarColor}`}>{d.initials}</span>
      )}
      <div class="dw-doctor-head-body">
        <span class="dw-doctor-name">{d.shortName}</span>
        <span class="dw-doctor-spec">{d.specialization}</span>
      </div>
    </div>
    {d.city && <div class="dw-doctor-meta"><span class="dw-doctor-muted">{d.city}</span></div>}
    <div class="dw-doctor-cta-row">
      {formatPriceKgs(d.priceFrom)
        ? <span class="dw-doctor-price">от <strong>{formatPriceKgs(d.priceFrom)}</strong></span>
        : <span />}
      <span class="dw-doctor-book">Записаться</span>
    </div>
  </a>
))}
```

Подпись секции на ~строке 738 (`{nearbyDoctors.length} врачей`) поправить на
`{doctors.length} {pluralizeDoctor(doctors.length)}`.

Секцию «Онлайн-консультации» (~667–727) **не трогать** — она уже отключена
обёрткой `<!-- false && ... -->`.

- [ ] **Шаг 3: Добавить стили инициалов для десктопа**

```css
.dw-stack-avatar-initials,
.dw-doctor-avatar-initials {
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #0f1115;
}
.dw-doctor-name,
.dw-doctor-spec {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Шаг 4: Проверить, что мок-импортов не осталось**

Запустить: `/usr/bin/grep -n "DOCTOR_MOCKS\|onlineDoctors\|nearbyDoctors\|DOCTOR_PHOTOS\|nearbyAvatars" web/pages/index.astro`
Ожидается: пусто.

- [ ] **Шаг 5: Собрать и посмотреть глазами**

```bash
pnpm exec astro build
```

Затем поднять dev-сервер и открыть `/` на мобильном (375×812) и десктопном
разрешении. Проверить обязательно: одна лента, инициалы вместо фото, цена в сомах,
имена не вылезают за карточку.

- [ ] **Шаг 6: Коммит**

```bash
git add web/pages/index.astro
git commit -m "feat(home): render real doctors in desktop layout"
```

---

## Task 10: Страница врача

**Файлы:**

- Изменить: `web/pages/doctor/[id].astro` (frontmatter 1–145, разметка 147–435)

- [ ] **Шаг 1: Переписать `getStaticPaths`**

Строки 6 и 10–17 заменить на:

```astro
import { searchDoctors, getDoctorProfile, formatPriceKgs } from "@/entities/doctor";

export async function getStaticPaths() {
  const doctors = await searchDoctors();
  const paths = await Promise.all(
    doctors.map(async (item) => {
      const doctor = await getDoctorProfile(item.id);
      return doctor === null
        ? null
        : { params: { id: doctorSlug({ id: doctor.id, name: doctor.fullName }) }, props: { doctor } };
    }),
  );
  // Профиль мог не открыться при живом поиске — такого врача пропускаем,
  // getDoctorProfile уже написал предупреждение в лог сборки.
  return paths.filter((path) => path !== null);
}
```

- [ ] **Шаг 2: Перевести производные значения frontmatter**

Заменить блок вычислений (строки ~19–66) на:

```astro
const { doctor } = Astro.props;

const specialty = SPECIALTIES.find((s) => s.doctorSpecialty === doctor.specialization);
const priceLabel = formatPriceKgs(doctor.priceFrom);
const workplace = doctor.workplaces[0] ?? null;
const clinicName = workplace?.name ?? null;

const description = doctor.bio
  ? doctor.bio.slice(0, 155) + (doctor.bio.length > 155 ? "…" : "")
  : `${doctor.fullName} — ${doctor.specialization}${clinicName ? ` в клинике «${clinicName}»` : ""}. Запись онлайн.`;

// «О враче» рендерится всегда. Без написанного bio собираем честный текст из
// того, что есть, ничего не выдумывая про медицину.
const bioText =
  doctor.bio ??
  [
    `${doctor.specialization}${doctor.subspecializations.length > 0 ? `, ${doctor.subspecializations.join(", ").toLowerCase()}` : ""}.`,
    doctor.yearsExperience !== null
      ? `Опыт работы — ${doctor.yearsExperience} ${pluralYears(doctor.yearsExperience)}.`
      : "",
    clinicName ? `Принимает в клинике ${clinicName}${doctor.city ? `, ${doctor.city}` : ""}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

const mapQuery = encodeURIComponent(
  [clinicName, workplace?.address, doctor.city].filter(Boolean).join(", "),
);
```

`pluralYears` (строки ~35–41) оставить без изменений.

- [ ] **Шаг 3: Обновить обращения к полям в разметке**

Сквозная замена по файлу:

| Было                  | Стало                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `doctor.name`         | `doctor.fullName`                                                 |
| `doctor.specialty`    | `doctor.specialization`                                           |
| `doctor.subspecialty` | убрать (есть `doctor.subspecializations`, уже вошли в `bioText`)  |
| `doctor.clinic`       | `clinicName` (обернуть в `{clinicName && ...}`)                   |
| `doctor.address`      | `workplace?.address`                                              |
| `doctor.photoUrl`     | `doctor.avatarUrl`                                                |
| `doctor.color`        | `doctor.avatarColor`                                              |
| `doctor.ratingCount`  | `doctor.reviewsCount`                                             |
| `doctor.priceFrom`    | `priceLabel` (уже отформатирован)                                 |
| `doctor.scheduleNote` | `doctor.scheduleNote` (имя совпало)                               |
| `doctor.languages`    | `doctor.languages` (теперь всегда массив, `?.length` → `.length`) |

Удалить блоки, для которых данных нет вовсе: `treats` (`conditionsTreated`),
`certificates`, `formats` (`consultationFormats`), `doctor.reviews`,
`doctor.clinicHours`, `doctor.phone`, `doctor.distance`, `doctor.insurances`,
`doctor.recommendRate`. Вместе с ними — секцию «Сертификаты и членство» и всё, что
осталось пустым.

Секция «Образование» показывается только при `doctor.education !== null`.

- [ ] **Шаг 4: Поправить JSON-LD**

В `physicianJsonLd`: `name: doctor.fullName`, `medicalSpecialty: doctor.specialization`,
`worksFor` собирать из `clinicName`/`workplace?.address` и опускать целиком, если
`workplace === null`. Блок `review` удалить — отзывов в API нет. `aggregateRating`
оставить под условием `doctor.rating !== null`, с `reviewCount: doctor.reviewsCount`.

В `breadcrumbs` заменить `doctor.name` на `doctor.fullName`.

- [ ] **Шаг 5: Оставить панель записи на моках**

`generateMockSlots(doctor.id, 14)` и вся инлайн-панель записи, `BookingTrigger`,
`BookingModal` и скрипт в конце файла **остаются как есть**. Реальные слоты — предмет
отдельной спеки по записи на приём. Генератор детерминирован по строке id, UUID он
переварит.

Строку `Первичный приём · 45 минут` (~226) оставить: это часть панели записи,
которая переедет на реальные виды приёма в следующей спеке.

- [ ] **Шаг 6: Проверить**

```bash
pnpm exec astro check && pnpm exec tsc -b --noEmit
pnpm exec oxlint --type-aware
pnpm exec astro build
```

Ожидается: в `dist/` появились каталоги на каждого реального врача, старых
мок-слагов (`kadyrov-anvar-maratovich-d1`) нет.

- [ ] **Шаг 7: Коммит**

```bash
git add web/pages/doctor/\[id\].astro
git commit -m "feat(doctor-page): render real doctor profile from backend"
```

---

## Task 11: Итоговая проверка

**Файлы:** не изменяются

- [ ] **Шаг 1: Полный прогон проверок**

```bash
pnpm exec astro check && pnpm exec tsc -b --noEmit
pnpm exec oxlint --type-aware
pnpm exec oxfmt --check .
pnpm exec steiger ./src
pnpm exec astro build
```

Все пять команд зелёные.

- [ ] **Шаг 2: Живая проверка в браузере**

Поднять dev-сервер и пройти:

1. `/` на 375×812 — одна лента, инициалы, цена в сомах.
2. `/` на десктопе — стопка аватаров с инициалами, карусель с реальными врачами.
3. Клик по карточке ведёт на страницу врача и **не даёт 404**.
4. Страница врача «Se Петровский» — контрольный случай на мусорные данные: длинные
   бессмысленные субспециализации не должны ломать вёрстку.
5. Страница врача без bio, без education, без рейтинга — пустые секции не рендерятся
   и не оставляют дыр.

- [ ] **Шаг 3: Проверить, что SPA цела**

Открыть `/app`, `/app/visits`, `/app/profile` — они по-прежнему на моках и должны
работать как раньше.

- [ ] **Шаг 4: Финальный коммит, если остались правки**

```bash
git add -A
git commit -m "fix(catalog): polish real doctor catalog rendering"
```

---

## Самопроверка плана

**Покрытие спеки.** Слой данных — Tasks 2–7. Урезанная карточка и одна лента —
Tasks 8–9. SSG и фолбэк — Task 5 (бросает при пустом каталоге и недоступном API) плюс
Task 10 (`getStaticPaths`). Слаг — Tasks 8–10 (`doctorSlug` с `fullName`). Переменная
окружения — Task 1. Проверка — Task 11. Долги бэкенда — фиксируются в спеке, кода не
требуют. Раздел «Что НЕ входит» соблюдён: `get-doctors.ts`, `search.astro` и `src/pages/*`
в карте файлов отсутствуют.

**Согласованность имён.** `DoctorListItem` и `DoctorProfileView` объявлены в Task 4 и
используются в Tasks 5–10 с теми же полями. `formatPriceKgs` объявлена в Task 3,
реэкспортирована в Task 7, вызывается в Tasks 8–10. `searchDoctors`/`getDoctorProfile`
объявлены в Tasks 5–6, реэкспортированы в Task 7, вызываются в Tasks 8 и 10.
`avatarColor` приходит из маппера, а не считается в разметке.

**Известное расхождение, оставленное сознательно:** `doctorSlug` в `web/lib/slug.ts`
принимает `{ id, name }`, а у нас `fullName`, поэтому во всех вызовах стоит явный
`doctorSlug({ id: d.id, name: d.fullName })`. Менять сигнатуру ради одного поля не
стал — `slug.ts` используется и мок-кодом страницы поиска.
