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
