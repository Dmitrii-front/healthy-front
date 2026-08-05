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

// ОТКЛОНЕНИЕ ОТ ПЛАНА: id вида 'id-1' не проходят DoctorSearchItemSchema
// (id: z.uuid()) — searchDoctors() отбрасывает такие записи поштучно и
// каталог оказывается пуст ещё до вызова getDoctorProfile. Заменяем на
// валидные UUID, сохраняя значение и смысл теста (различимые id по номеру).
function doctorId(n: number): string {
  return `00000000-0000-4000-8000-00000000000${n}`
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
    stubApi([doctorId(1), doctorId(2), doctorId(3)])
    const { loadDoctorCatalog } = await freshLoader()

    const catalog = await loadDoctorCatalog()

    expect(catalog).toHaveLength(3)
    expect(catalog[0]?.yearsExperience).not.toBeNull()
  })

  it('второй вызов не идёт в сеть — промис закэширован', async () => {
    const fetchMock = stubApi([doctorId(1), doctorId(2)])
    const { loadDoctorCatalog } = await freshLoader()

    await loadDoctorCatalog()
    const callsAfterFirst = fetchMock.mock.calls.length
    await loadDoctorCatalog()

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('параллельные вызовы схлопываются в одну загрузку', async () => {
    const fetchMock = stubApi([doctorId(1), doctorId(2)])
    const { loadDoctorCatalog } = await freshLoader()

    await Promise.all([loadDoctorCatalog(), loadDoctorCatalog(), loadDoctorCatalog()])

    // Одна страница поиска плюс два профиля.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('пропускает удалённого врача, если таких единицы', async () => {
    stubApi([doctorId(1), doctorId(2), doctorId(3), doctorId(4), doctorId(5)], (id) =>
      id === doctorId(3) ? 404 : 200,
    )
    const { loadDoctorCatalog } = await freshLoader()

    const catalog = await loadDoctorCatalog()

    expect(catalog).toHaveLength(4)
  })

  it('останавливает сборку, если пропала большая часть каталога', async () => {
    // Сплошные 404 означают не гонку с удалением, а сменившийся маршрут
    // или неверный адрес API.
    stubApi([doctorId(1), doctorId(2), doctorId(3), doctorId(4)], (id) =>
      id === doctorId(1) ? 200 : 404,
    )
    const { loadDoctorCatalog } = await freshLoader()

    await expect(loadDoctorCatalog()).rejects.toThrow(/каталог/iu)
  })

  it('останавливает сборку при отказе сервера, а не пропускает врача', async () => {
    stubApi([doctorId(1), doctorId(2)], (id) => (id === doctorId(2) ? 500 : 200))
    const { loadDoctorCatalog } = await freshLoader()

    await expect(loadDoctorCatalog()).rejects.toThrow(/500/u)
  })
})
