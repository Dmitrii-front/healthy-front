# MR 2: Загрузчик каталога и устойчивость сборки — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Свести получение каталога врачей на сборке к одному мемоизированному загрузчику и сделать так, чтобы сбой API останавливал сборку, а не выкатывал витрину с битыми ссылками.

**Architecture:** Появляется `loadDoctorCatalog()` — единственная точка получения полных профилей на сборке, с кэшем промиса на всё время жизни модуля. Astro выполняет `getStaticPaths` страницы врача до рендера остальных страниц, поэтому главная и (в следующем MR) поиск получают уже прогретый кэш бесплатно. Попутно `getDoctorProfile` перестаёт возвращать `null` на любую беду: 404 отличается от отказа сервера, а транспортная ошибка больше не роняет сборку невнятным исключением.

**Tech Stack:** Vitest 4, TypeScript 6 strict, Astro 7 (адаптер Cloudflare, `output: 'static'`).

**Спека:** `docs/superpowers/specs/2026-08-05-doctors-search-astro-design.md`, разделы 2 и 3.

**Зависит от:** MR 1 (нужен тестовый раннер). Страницу `/search` этот MR не трогает — она остаётся на моках до MR 4.

---

## File Structure

| Файл                                                            | Ответственность                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/shared/lib/map-with-concurrency.ts` (создать)              | Обход списка с ограничением числа одновременных задач         |
| `src/shared/lib/map-with-concurrency.test.ts` (создать)         | Тесты: порядок результатов, соблюдение лимита, проброс ошибки |
| `src/shared/lib/index.ts` (изменить)                            | Экспорт утилиты                                               |
| `src/entities/doctor/api/get-doctor-profile.ts` (изменить)      | Размеченный результат вместо `null`, повторы, честные ошибки  |
| `src/entities/doctor/api/get-doctor-profile.test.ts` (создать)  | Тесты политики ошибок                                         |
| `src/entities/doctor/api/load-doctor-catalog.ts` (создать)      | Загрузчик каталога с мемоизацией и инвариантом полноты        |
| `src/entities/doctor/api/load-doctor-catalog.test.ts` (создать) | Тесты кэша и инварианта                                       |
| `src/entities/doctor/index.ts` (изменить)                       | Экспорт загрузчика                                            |
| `web/lib/slug.ts` (изменить)                                    | `doctorProfileSlug` — типобезопасная обёртка                  |
| `web/pages/doctor/[id].astro` (изменить)                        | `getStaticPaths` переходит на загрузчик                       |
| `web/pages/index.astro` (изменить)                              | Главная переходит на загрузчик                                |

---

## Task 1: Утилита ограниченной конкурентности

Сейчас `getStaticPaths` делает `Promise.all` по всему каталогу — при семи врачах незаметно, при тысяче это тысяча одновременных соединений из одного процесса.

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/src/shared/lib/map-with-concurrency.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/src/shared/lib/map-with-concurrency.test.ts`
- Modify: `/Users/vladimir/Development/healthy-mobile/src/shared/lib/index.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/shared/lib/map-with-concurrency.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { mapWithConcurrency } from './map-with-concurrency'

describe('mapWithConcurrency', () => {
  it('сохраняет порядок результатов, а не порядок завершения', async () => {
    // Первый элемент отвечает дольше всех — он всё равно обязан остаться первым.
    const delays = [30, 20, 10, 0]
    const result = await mapWithConcurrency(delays, 2, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
      return ms
    })
    expect(result).toEqual([30, 20, 10, 0])
  })

  it('не запускает больше задач, чем разрешено лимитом', async () => {
    let running = 0
    let peak = 0

    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async (n) => {
        running += 1
        peak = Math.max(peak, running)
        await new Promise((resolve) => setTimeout(resolve, 1))
        running -= 1
        return n
      },
    )

    expect(peak).toBeLessThanOrEqual(3)
    expect(peak).toBeGreaterThan(1)
  })

  it('обрабатывает весь список, когда он длиннее лимита', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const result = await mapWithConcurrency(items, 8, async (n) => n * 2)
    expect(result).toHaveLength(50)
    expect(result[49]).toBe(98)
  })

  it('отдаёт пустой список для пустого входа и не зовёт обработчик', async () => {
    let calls = 0
    const result = await mapWithConcurrency([], 4, async (n: number) => {
      calls += 1
      return n
    })
    expect(result).toEqual([])
    expect(calls).toBe(0)
  })

  it('пробрасывает ошибку обработчика наверх', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('обработчик упал')
        return n
      }),
    ).rejects.toThrow('обработчик упал')
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/shared/lib/map-with-concurrency.test.ts
```

Ожидается: провал — модуль `./map-with-concurrency` не найден.

- [ ] **Step 3: Реализовать утилиту**

Создать `/Users/vladimir/Development/healthy-mobile/src/shared/lib/map-with-concurrency.ts`:

```ts
/**
 * Обходит список, держа в работе не больше `limit` задач одновременно.
 *
 * Нужна на сборке витрины: каталог врачей обходится запросом на каждого, и
 * голый Promise.all открыл бы столько соединений, сколько врачей в базе.
 * Порядок результатов соответствует порядку входа, а не порядку завершения.
 *
 * Первая же ошибка обработчика уходит наверх — вызывающая сторона решает,
 * останавливать сборку или нет.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined) continue
      results[index] = await fn(item, index)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)

  return results
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/shared/lib/map-with-concurrency.test.ts
```

Ожидается: 5 тестов пройдено.

- [ ] **Step 5: Экспортировать из бареля**

В `src/shared/lib/index.ts` добавить строку после экспорта `cn`:

```ts
export { mapWithConcurrency } from './map-with-concurrency'
```

- [ ] **Step 6: Проверить типы и FSD**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit && pnpm exec steiger ./src
```

Ожидается: обе команды успешны.

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/shared/lib/map-with-concurrency.ts src/shared/lib/map-with-concurrency.test.ts src/shared/lib/index.ts
git commit -m "feat(shared): обход списка с ограничением конкурентности"
```

---

## Task 2: Развести отсутствие врача и отказ сервера

Сейчас `getDoctorProfile` возвращает `null` и на 404, и на 500, и на битую схему, а транспортную ошибку не ловит вовсе — она вылетает из `Promise.all` и роняет сборку без внятного сообщения. Результат: при исчерпании лимита запросов врачи молча исчезают с витрины, сборка завершается успехом и деплоится.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/get-doctor-profile.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/get-doctor-profile.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/get-doctor-profile.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getDoctorProfile } from './get-doctor-profile'

const ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

/** Минимальный валидный ответ бэкенда — ровно то, что требует схема профиля. */
function profilePayload(): unknown {
  return {
    status: 'Ok',
    payload: {
      id: ID,
      first_name: 'Иван',
      last_name: 'Иванов',
      middle_name: null,
      avatar_url: null,
      bio: null,
      specialization: 'Стоматолог',
      start_practise_date: '2015-03-01',
      education: null,
      languages: ['ru'],
      subspecializations: [],
      consultation_formats: [],
      primary_work_city: 'Бишкек',
      price_from: 1000,
      schedule_note: null,
      chat_enabled: false,
      rating: null,
      reviews_count: 0,
      workplaces: [],
      appointment_types: [],
    },
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getDoctorProfile', () => {
  it('отдаёт профиль при успешном ответе', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(profilePayload())),
    )

    const result = await getDoctorProfile(ID)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.doctor.fullName).toBe('Иванов Иван')
      expect(result.doctor.specialization).toBe('Стоматолог')
    }
  })

  it('на 404 сообщает, что врача нет, и не бросает', async () => {
    // Законная гонка: профиль удалили между выдачей поиска и запросом.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 })),
    )

    const result = await getDoctorProfile(ID)

    expect(result).toEqual({ ok: false, reason: 'missing' })
  })

  it('на 500 бросает после исчерпания повторов', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getDoctorProfile(ID, { retries: 2, delayMs: 0 })).rejects.toThrow(/500/u)
    // Первая попытка плюс два повтора.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('на 429 повторяет и отдаёт результат, если сервер отпустил', async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(jsonResponse(profilePayload()))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getDoctorProfile(ID, { retries: 2, delayMs: 0 })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('на транспортной ошибке бросает, а не роняет сборку без объяснения', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET')
      }),
    )

    await expect(getDoctorProfile(ID, { retries: 1, delayMs: 0 })).rejects.toThrow(/ECONNRESET/u)
  })

  it('на неожиданной структуре ответа бросает: строить страницу не из чего', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ status: 'Ok', payload: { id: ID } })),
    )

    await expect(getDoctorProfile(ID, { retries: 0, delayMs: 0 })).rejects.toThrow(/валидац/iu)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/api/get-doctor-profile.test.ts
```

Ожидается: провал — функция возвращает `DoctorProfileView | null`, у результата нет поля `ok`.

- [ ] **Step 3: Переписать функцию**

Заменить содержимое `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/get-doctor-profile.ts` целиком:

```ts
import { env } from '@/shared/config'

import { DoctorProfileResponseSchema } from '../model/doctor-api.schema'
import { toDoctorProfileView } from '../model/doctor-view'
import type { DoctorProfileView } from '../model/doctor-view'

/**
 * Результат запроса профиля. `missing` — единственный исход, при котором врача
 * законно пропустить: его профиль удалили между выдачей поиска и этим запросом.
 * Всё остальное — исключение: молча выкатывать витрину без части врачей нельзя,
 * главная продолжит ссылаться на несуществующие страницы.
 */
export type DoctorProfileResult =
  | { ok: true; doctor: DoctorProfileView }
  | { ok: false; reason: 'missing' }

interface GetDoctorProfileOptions {
  /** Сколько раз повторить при отказе сервера. */
  retries?: number
  /** Пауза между повторами; ноль используется в тестах. */
  delayMs?: number
}

const DEFAULT_RETRIES = 2
const DEFAULT_DELAY_MS = 500

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Полный публичный профиль врача. В отличие от выдачи поиска содержит стаж,
 * образование, рейтинг и места работы. Вызывается только на сборке.
 *
 * 429 и 5xx повторяются: под лимитом запросов бэкенда сборка каталога легко
 * ловит отказ, который проходит сам через секунду.
 */
export async function getDoctorProfile(
  id: string,
  options: GetDoctorProfileOptions = {},
): Promise<DoctorProfileResult> {
  const retries = options.retries ?? DEFAULT_RETRIES
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const url = new URL(`/doctor-profile/${id}`, env.API_URL)

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await sleep(delayMs)

    let response: Response
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } })
    } catch (error) {
      // Обрыв соединения, исчерпание сокетов, недоступный хост. Раньше это
      // исключение вылетало из Promise.all и роняло сборку без объяснения.
      lastError = new Error(
        `Профиль ${id}: сеть недоступна (${error instanceof Error ? error.message : String(error)})`,
      )
      continue
    }

    if (response.status === 404) return { ok: false, reason: 'missing' }

    if (!response.ok) {
      lastError = new Error(
        `Профиль ${id} недоступен: ${response.status} ${response.statusText}. Запрошен ${url.toString()}`,
      )
      continue
    }

    const parsed = DoctorProfileResponseSchema.safeParse(await response.json())
    if (!parsed.success) {
      // Повтор не поможет: контракт разъехался. Пропускать врача тоже нельзя —
      // это не отсутствие записи, а неизвестная форма ответа.
      throw new Error(`Профиль ${id} не прошёл валидацию: ${parsed.error.message}`)
    }

    return { ok: true, doctor: toDoctorProfileView(parsed.data.payload) }
  }

  throw lastError ?? new Error(`Профиль ${id}: запрос не удался`)
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/api/get-doctor-profile.test.ts
```

Ожидается: 6 тестов пройдено.

Если тест на валидацию падает с другим текстом — сверить формулировку сообщения в коде с регуляркой `/валидац/iu` в тесте.

- [ ] **Step 5: Починить вызывающий код**

Смена сигнатуры ломает `web/pages/doctor/[id].astro`. Проверить:

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec astro check 2>&1 | head -20
```

Ожидается: ошибка в `web/pages/doctor/[id].astro` — сравнение результата с `null`. Временно привести `getStaticPaths` к новой форме (в Task 4 этот блок будет переписан целиком):

```ts
export async function getStaticPaths() {
  const catalog = await searchDoctors()
  const paths = await Promise.all(
    catalog.map(async (item) => {
      const result = await getDoctorProfile(item.id)
      return result.ok
        ? {
            params: { id: doctorSlug({ id: result.doctor.id, name: result.doctor.fullName }) },
            props: { doctor: result.doctor },
          }
        : null
    }),
  )
  return paths.filter((path) => path !== null)
}
```

- [ ] **Step 6: Проверить типы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec astro check && pnpm exec tsc -b --noEmit
```

Ожидается: обе команды успешны.

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/api/get-doctor-profile.ts src/entities/doctor/api/get-doctor-profile.test.ts "web/pages/doctor/[id].astro"
git commit -m "fix(doctors): отличать отсутствие врача от отказа сервера

Раньше null возвращался и на 404, и на 500, и на битую схему, а
транспортная ошибка вылетала мимо обработки. Под лимитом запросов
врачи молча исчезали с витрины, а сборка считалась успешной."
```

---

## Task 3: Загрузчик каталога с кэшем и инвариантом полноты

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/load-doctor-catalog.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/load-doctor-catalog.test.ts`
- Modify: `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/index.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/load-doctor-catalog.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Загрузчик кэширует промис в области модуля — ровно то поведение, ради
 * которого он написан. Поэтому каждый тест поднимает свежую копию модуля
 * через vi.resetModules(), иначе кэш течёт между тестами.
 */
async function freshLoader() {
  vi.resetModules()
  return await import('./load-doctor-catalog')
}

function searchPayload(ids: string[]): unknown {
  return {
    status: 'Ok',
    payload: {
      items: ids.map((id, index) => ({
        id,
        first_name: `Имя${index}`,
        last_name: `Фамилия${index}`,
        middle_name: null,
        avatar_url: null,
        bio: null,
        specialization: 'Стоматолог',
        primary_work_city: 'Бишкек',
        price_from: 1000,
        languages: ['ru'],
        subspecializations: [],
        consultation_formats: [],
        schedule_note: null,
        chat_enabled: false,
        created_at: '2026-01-01T00:00:00.000Z',
      })),
      nextCursor: null,
    },
  }
}

function profilePayload(id: string): unknown {
  return {
    status: 'Ok',
    payload: {
      id,
      first_name: 'Иван',
      last_name: 'Иванов',
      middle_name: null,
      avatar_url: null,
      bio: null,
      specialization: 'Стоматолог',
      start_practise_date: '2015-03-01',
      education: null,
      languages: ['ru'],
      subspecializations: [],
      consultation_formats: [],
      primary_work_city: 'Бишкек',
      price_from: 1000,
      schedule_note: null,
      chat_enabled: false,
      rating: null,
      reviews_count: 0,
      workplaces: [],
      appointment_types: [],
    },
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Отвечает на поиск списком ids, на профили — по правилу profileStatus. */
function stubApi(ids: string[], profileStatus: (id: string) => number = () => 200) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const href = input instanceof URL ? input.href : String(input)
    if (href.includes('/doctor-profile/search')) return json(searchPayload(ids))

    const id = href.slice(href.lastIndexOf('/') + 1)
    const status = profileStatus(id)
    if (status !== 200) return new Response(null, { status })
    return json(profilePayload(id))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadDoctorCatalog', () => {
  it('отдаёт полные профили всех врачей каталога', async () => {
    stubApi(['id-1', 'id-2', 'id-3'])
    const { loadDoctorCatalog } = await freshLoader()

    const catalog = await loadDoctorCatalog()

    expect(catalog).toHaveLength(3)
    expect(catalog[0]?.yearsExperience).not.toBeNull()
  })

  it('второй вызов не идёт в сеть — промис закэширован', async () => {
    const fetchMock = stubApi(['id-1', 'id-2'])
    const { loadDoctorCatalog } = await freshLoader()

    await loadDoctorCatalog()
    const callsAfterFirst = fetchMock.mock.calls.length
    await loadDoctorCatalog()

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('параллельные вызовы схлопываются в одну загрузку', async () => {
    const fetchMock = stubApi(['id-1', 'id-2'])
    const { loadDoctorCatalog } = await freshLoader()

    await Promise.all([loadDoctorCatalog(), loadDoctorCatalog(), loadDoctorCatalog()])

    // Одна страница поиска плюс два профиля.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('пропускает удалённого врача, если таких единицы', async () => {
    stubApi(['id-1', 'id-2', 'id-3', 'id-4', 'id-5'], (id) => (id === 'id-3' ? 404 : 200))
    const { loadDoctorCatalog } = await freshLoader()

    const catalog = await loadDoctorCatalog()

    expect(catalog).toHaveLength(4)
  })

  it('останавливает сборку, если пропала большая часть каталога', async () => {
    // Сплошные 404 означают не гонку с удалением, а сменившийся маршрут
    // или неверный адрес API.
    stubApi(['id-1', 'id-2', 'id-3', 'id-4'], (id) => (id === 'id-1' ? 200 : 404))
    const { loadDoctorCatalog } = await freshLoader()

    await expect(loadDoctorCatalog()).rejects.toThrow(/каталог/iu)
  })

  it('останавливает сборку при отказе сервера, а не пропускает врача', async () => {
    stubApi(['id-1', 'id-2'], (id) => (id === 'id-2' ? 500 : 200))
    const { loadDoctorCatalog } = await freshLoader()

    await expect(loadDoctorCatalog()).rejects.toThrow(/500/u)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/api/load-doctor-catalog.test.ts
```

Ожидается: провал — модуль `./load-doctor-catalog` не найден.

- [ ] **Step 3: Реализовать загрузчик**

Создать `/Users/vladimir/Development/healthy-mobile/src/entities/doctor/api/load-doctor-catalog.ts`:

```ts
import { mapWithConcurrency } from '@/shared/lib'

import type { DoctorProfileView } from '../model/doctor-view'
import { getDoctorProfile } from './get-doctor-profile'
import { searchDoctors } from './search-doctors'

/** Сколько профилей тянем одновременно. Больше — риск упереться в лимит запросов. */
const CONCURRENCY = 8

/**
 * Доля врачей, которых допустимо потерять по 404. Единичные пропажи — законная
 * гонка с удалением профиля; массовые означают сменившийся маршрут или чужой
 * адрес API, и выкатывать такую витрину нельзя.
 */
const MAX_MISSING_SHARE = 0.25

let cache: Promise<DoctorProfileView[]> | null = null

/**
 * Весь каталог верифицированных врачей с полными профилями. Только сборка.
 *
 * Промис кэшируется на всё время жизни модуля и НЕ сбрасывается после
 * разрешения: Astro исполняет getStaticPaths страницы врача раньше рендера
 * остальных страниц, поэтому главная и поиск получают готовый каталог даром.
 * Сброс превратил бы кэш в дедуп одновременных вызовов, и каждая страница
 * тянула бы каталог заново.
 *
 * Отклонённый промис тоже остаётся в кэше — это безопасно: любая неудача здесь
 * останавливает сборку, повторять нечего.
 *
 * В `astro dev` каталог замораживается на всю сессию; за свежими данными —
 * перезапуск сервера. Это дешевле, чем нынешний повторный обход на каждое
 * открытие страницы врача.
 */
export function loadDoctorCatalog(): Promise<DoctorProfileView[]> {
  cache ??= load()
  return cache
}

async function load(): Promise<DoctorProfileView[]> {
  const catalog = await searchDoctors()

  const results = await mapWithConcurrency(catalog, CONCURRENCY, (item) =>
    getDoctorProfile(item.id),
  )

  const doctors = results.filter((result) => result.ok).map((result) => result.doctor)
  const missing = catalog.length - doctors.length

  if (missing > 0) {
    const share = missing / catalog.length
    if (share > MAX_MISSING_SHARE) {
      throw new Error(
        `Каталог собрался неполным: ${missing} из ${catalog.length} профилей не открылись. ` +
          'Похоже на сменившийся маршрут или чужой PUBLIC_API_URL, а не на удаление врачей. ' +
          'Сборка остановлена, чтобы не выкатить витрину со ссылками в никуда.',
      )
    }
    console.warn(
      `[doctors] пропущено врачей: ${missing} из ${catalog.length} — их профили отдали 404`,
    )
  }

  return doctors
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run src/entities/doctor/api/load-doctor-catalog.test.ts
```

Ожидается: 6 тестов пройдено.

- [ ] **Step 5: Экспортировать из слайса**

В `src/entities/doctor/index.ts` добавить после экспорта `getDoctorProfile`:

```ts
export { loadDoctorCatalog } from './api/load-doctor-catalog'
export type { DoctorProfileResult } from './api/get-doctor-profile'
```

- [ ] **Step 6: Проверить типы и FSD**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit && pnpm exec steiger ./src
```

Ожидается: обе команды успешны.

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add src/entities/doctor/api/load-doctor-catalog.ts src/entities/doctor/api/load-doctor-catalog.test.ts src/entities/doctor/index.ts
git commit -m "feat(doctors): общий загрузчик каталога с кэшем на всю сборку"
```

---

## Task 4: Типобезопасный слаг врача

`doctorSlug` принимает `{ id, name }`, а у профиля поле называется `fullName`. Сегодня это работает только потому, что вызывающий код собирает объект руками; ошибка здесь не ловится типами и даёт 404 на каждой ссылке.

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/lib/slug.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/slug.test.ts`

- [ ] **Step 1: Написать падающий тест**

Дописать в конец `/Users/vladimir/Development/healthy-mobile/web/lib/slug.test.ts` (и добавить `doctorProfileSlug` в существующий импорт из `./slug`):

```ts
describe('doctorProfileSlug', () => {
  const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

  it('берёт имя из профиля, не требуя собирать объект руками', () => {
    expect(doctorProfileSlug({ id, fullName: 'Иванов Иван Иванович' })).toBe(
      `ivanov-ivan-ivanovich-${id}`,
    )
  })

  it('даёт тот же слаг, что и doctorSlug на тех же данных', () => {
    // Страница врача и ссылки на неё обязаны считать слаг одинаково,
    // иначе выдача ведёт на несуществующие страницы.
    expect(doctorProfileSlug({ id, fullName: 'Петров Пётр' })).toBe(
      doctorSlug({ id, name: 'Петров Пётр' }),
    )
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/slug.test.ts
```

Ожидается: провал — `doctorProfileSlug` не экспортируется.

- [ ] **Step 3: Добавить обёртку**

Дописать в конец `/Users/vladimir/Development/healthy-mobile/web/lib/slug.ts`:

```ts
/**
 * Слаг по профилю врача. Существует ради одного: у профиля поле называется
 * fullName, у doctorSlug параметр — name, и перепутать их легко. Ошибка не
 * ловится типами и проявляется как 404 на всех карточках выдачи.
 */
export function doctorProfileSlug(doctor: { id: string; fullName: string }): string {
  return doctorSlug({ id: doctor.id, name: doctor.fullName })
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/slug.test.ts
```

Ожидается: 10 тестов пройдено.

- [ ] **Step 5: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/slug.ts web/lib/slug.test.ts
git commit -m "feat(slug): типобезопасная обёртка слага по профилю врача"
```

---

## Task 5: Перевести страницы на загрузчик

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/doctor/[id].astro` (frontmatter)
- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/index.astro` (frontmatter)

- [ ] **Step 1: Перевести страницу врача**

В `web/pages/doctor/[id].astro` заменить импорт

```ts
import {
  searchDoctors,
  getDoctorProfile,
  formatPriceKgs,
  formatExperienceLabel,
} from '@/entities/doctor'
import { doctorSlug } from '../../lib/slug'
```

на

```ts
import { loadDoctorCatalog, formatPriceKgs, formatExperienceLabel } from '@/entities/doctor'
import { doctorProfileSlug } from '../../lib/slug'
```

и заменить `getStaticPaths` целиком:

```ts
export async function getStaticPaths() {
  // Загрузчик кэширует каталог на всю сборку: главная и поиск получат его
  // отсюда бесплатно. Политика ошибок живёт внутри — сюда доезжают только
  // врачи с открывшимися профилями.
  const catalog = await loadDoctorCatalog()
  return catalog.map((doctor) => ({
    params: { id: doctorProfileSlug(doctor) },
    props: { doctor },
  }))
}
```

- [ ] **Step 2: Перевести главную**

В `web/pages/index.astro` заменить импорт врачей — найти строку с `searchDoctors`:

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'searchDoctors\|doctorSlug' web/pages/index.astro
```

Заменить `searchDoctors` на `loadDoctorCatalog` в импорте из `@/entities/doctor`, а `doctorSlug` на `doctorProfileSlug` в импорте из `../lib/slug`.

Заменить строку загрузки:

```ts
const doctors = await searchDoctors()
```

на

```ts
// Тот же кэшированный каталог, что и у страниц врачей: раньше главная
// тянула его вторым независимым обходом.
const doctors = await loadDoctorCatalog()
```

Заменить оба построения ссылок (строки около 296 и 554):

```astro
href={`/doctor/${doctorSlug({ id: d.id, name: d.fullName })}`}
```

на

```astro
href={`/doctor/${doctorProfileSlug(d)}`}
```

- [ ] **Step 3: Проверить типы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec astro check && pnpm exec tsc -b --noEmit
```

Ожидается: обе команды успешны. Тип `DoctorProfileView` шире, чем `DoctorListItem`, поэтому существующая разметка главной продолжает работать без правок.

- [ ] **Step 4: Собрать витрину и убедиться, что каталог грузится один раз**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build 2>&1 | tail -25
```

Ожидается: сборка проходит, страницы врачей сгенерированы. В логе не должно быть двух отдельных обходов каталога.

- [ ] **Step 5: Проверить, что ссылки главной ведут на существующие страницы**

```bash
cd /Users/vladimir/Development/healthy-mobile && python3 - <<'PY'
import pathlib, re
root = pathlib.Path('dist/client')
built = {p.parent.name for p in root.glob('doctor/*/index.html')}
home = (root / 'index.html').read_text(encoding='utf-8')
linked = set(re.findall(r'/doctor/([^"\'/?#]+)', home))
missing = linked - built
print(f'страниц врачей собрано: {len(built)}')
print(f'ссылок на главной: {len(linked)}')
print('битые ссылки:', missing or 'нет')
PY
```

Ожидается: «битые ссылки: нет». До этого MR врач с неоткрывшимся профилем получал ссылку с главной, но не получал страницы.

- [ ] **Step 6: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add "web/pages/doctor/[id].astro" web/pages/index.astro
git commit -m "refactor(build): перевести главную и страницы врачей на общий загрузчик

Каталог обходился дважды за сборку — из главной и из getStaticPaths.
Теперь он берётся из кэша, а врач без профиля больше не получает
ссылку с главной."
```

---

## Task 6: Финальная проверка MR

- [ ] **Step 1: Прогнать все проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm fsd
```

Ожидается: всё зелёное, тестов около 51.

- [ ] **Step 2: Проверить поведение при недоступном API**

```bash
cd /Users/vladimir/Development/healthy-mobile && PUBLIC_API_URL=http://127.0.0.1:9 pnpm build 2>&1 | tail -5
```

Ожидается: сборка падает с внятным сообщением про недоступный каталог, а не с невнятным исключением из `Promise.all` и не успехом.

- [ ] **Step 3: Убедиться, что рабочая сборка на месте**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build && ls dist/client/doctor | head
```

Ожидается: сборка проходит, каталоги врачей на месте.

---

## Готовность MR

- [ ] Каталог загружается один раз за сборку и переиспользуется всеми страницами
- [ ] 404 отличается от отказа сервера; транспортная ошибка не роняет сборку молча
- [ ] Массовая пропажа профилей останавливает сборку
- [ ] Профили тянутся пулом, а не залпом
- [ ] Ссылки с главной ведут только на существующие страницы
- [ ] Слаг считается одной типобезопасной функцией

**Следующий MR:** `2026-08-05-mr3-bundled-script.md` — перевод клиентского скрипта `/search` на бандлящийся модуль.
