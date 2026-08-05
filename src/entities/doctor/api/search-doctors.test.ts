import { afterEach, describe, expect, it, vi } from 'vitest'

/** id вида 'id-1' не проходят DoctorSearchItemSchema (id: z.uuid()) — фикстуры
 * используют настоящие UUID, различимые по последнему символу. */
function doctorId(n: number): string {
  return `00000000-0000-4000-8000-00000000000${n}`
}

function validItem(n: number): Record<string, unknown> {
  return {
    id: doctorId(n),
    first_name: `Имя${n}`,
    last_name: `Фамилия${n}`,
    middle_name: null,
    avatar_url: null,
    specialization: 'Стоматолог',
    primary_work_city: 'Бишкек',
    price_from: 1000,
    languages: ['ru'],
  }
}

/** Гарантированно не проходит схему: id не в формате UUID. */
function brokenItem(n: number): unknown {
  return { ...validItem(n), id: `broken-id-${n}` }
}

function searchPayload(items: unknown[]): unknown {
  return {
    status: 'Ok',
    payload: { items, nextCursor: null },
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubSearch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => json(body, status))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchDoctors', () => {
  it('отдаёт врачей каталога', async () => {
    stubSearch(searchPayload([validItem(1), validItem(2), validItem(3)]))
    const { searchDoctors } = await import('./search-doctors')

    const doctors = await searchDoctors()

    expect(doctors).toHaveLength(3)
  })

  it('роняет одну битую запись, но каталог отдаёт', async () => {
    const items = [
      validItem(1),
      validItem(2),
      validItem(3),
      validItem(4),
      validItem(5),
      validItem(6),
      validItem(7),
      validItem(8),
      validItem(9),
      brokenItem(0),
    ]
    stubSearch(searchPayload(items))
    const { searchDoctors } = await import('./search-doctors')

    const doctors = await searchDoctors()

    expect(doctors).toHaveLength(9)
  })

  it('останавливает сборку, если схему не прошло большинство записей', async () => {
    const items = [
      validItem(1),
      validItem(2),
      brokenItem(0),
      brokenItem(3),
      brokenItem(4),
      brokenItem(5),
      brokenItem(6),
      brokenItem(7),
      brokenItem(8),
      brokenItem(9),
    ]
    stubSearch(searchPayload(items))
    const { searchDoctors } = await import('./search-doctors')

    await expect(searchDoctors()).rejects.toThrow(/валидац/iu)
  })

  it('бросает при недоступном API', async () => {
    stubSearch(null, 500)
    const { searchDoctors } = await import('./search-doctors')

    await expect(searchDoctors()).rejects.toThrow(/недоступен/iu)
  })

  it('бросает при полностью пустом каталоге', async () => {
    stubSearch(searchPayload([]))
    const { searchDoctors } = await import('./search-doctors')

    await expect(searchDoctors()).rejects.toThrow(/пуст/iu)
  })

  it('объясняет обрыв соединения, а не роняет сырое исключение fetch', async () => {
    // Самый частый первый сбой: неверный PUBLIC_API_URL даёт отказ соединения,
    // а не 500. Без обработки сюда прилетает исключение самого fetch, и всё
    // объяснение теряется в обёртке воркера.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    const { searchDoctors } = await import('./search-doctors')

    await expect(searchDoctors()).rejects.toThrow(/PUBLIC_API_URL/u)
  })

  it('объясняет ответ не в JSON, а не роняет сырой SyntaxError', async () => {
    // Самый вероятный симптом неверного адреса: по нему стоит веб-сервер,
    // он отвечает 200 и отдаёт HTML.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<!doctype html><html></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    )

    const { searchDoctors } = await import('./search-doctors')
    await expect(searchDoctors()).rejects.toThrow(/PUBLIC_API_URL/u)
  })
})
