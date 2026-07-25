/**
 * Минимальный HTTP-клиент для публичной Astro-зоны.
 *
 * Зачем отдельный, а не `apiClient` из `src/shared/api`: тот тянет zod и весь
 * SPA-слой, а SEO-бандл держим маленьким — здесь только `fetch` и разбор
 * конверта. Существующий `apiFetch` в `lib/auth.ts` для записи не годится: он
 * умеет только POST и не отправляет токен.
 *
 * Бэкенд отвечает конвертом `{ status: 'Ok', payload }` на успехе и
 * `{ errorCode, status: 'Error', payload: { code, message } }` на ошибке
 * (см. HttpExceptionFilter). Доменный код лежит в `errorCode` — именно на него
 * и надо смотреть, а не на HTTP-статус: `SLOT_TAKEN` и `RATING_ALREADY_GIVEN`
 * оба приходят как 409.
 */

import { readAuth, writeAuth } from './auth'

const envApiUrl = import.meta.env.PUBLIC_API_URL
const API_URL =
  typeof envApiUrl === 'string' && envApiUrl.length > 0 ? envApiUrl : 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string,
  ) {
    super(`API ${status} ${errorCode}`)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Добавить Authorization и обновить токен при 401. */
  auth?: boolean
  params?: Record<string, string>
}

interface Envelope {
  status?: string
  payload?: unknown
  errorCode?: string
}

function readEnvelope(raw: string): Envelope | null {
  if (raw.length === 0) return null
  try {
    // Свой бэкенд, форма конверта зафиксирована фильтром исключений.
    // eslint-disable-next-line typescript/no-unsafe-type-assertion
    return JSON.parse(raw) as Envelope
  } catch {
    return null
  }
}

/**
 * Обновление access-токена. Возвращает свежий токен или null, если сессия
 * умерла окончательно. `refresh` намеренно не рекурсивный: если он сам
 * ответил не 200, повторять нечего.
 */
async function refreshAccessToken(): Promise<string | null> {
  const auth = readAuth()
  if (!auth) return null

  let response: Response
  try {
    response = await fetch(new URL('/auth/refresh', API_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ userId: auth.userId, refreshToken: auth.refreshToken }),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  const envelope = readEnvelope(await response.text())
  const payload = envelope?.payload ?? envelope
  if (!payload || typeof payload !== 'object') return null
  const { accessToken, refreshToken } = payload as {
    accessToken?: string
    refreshToken?: string
  }
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return null

  writeAuth({ accessToken, refreshToken, userId: auth.userId })
  return accessToken
}

async function send<T>(path: string, options: RequestOptions, retried: boolean): Promise<T> {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (options.auth === true) {
    const token = readAuth()?.accessToken
    if (typeof token === 'string' && token.length > 0) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR')
  }

  if (response.status === 401 && options.auth === true && !retried) {
    const fresh = await refreshAccessToken()
    if (fresh !== null) return send<T>(path, options, true)
  }

  const raw = await response.text()
  const envelope = readEnvelope(raw)

  if (!response.ok) {
    throw new ApiError(response.status, envelope?.errorCode ?? `HTTP_${response.status}`)
  }

  // 204 и прочие пустые тела законны (например DELETE) — вызывающий обязан
  // объявить T так, чтобы null был допустим.
  // eslint-disable-next-line typescript/no-unsafe-type-assertion
  if (envelope === null) return null as T

  // Успешный конверт всегда несёт payload; POST /patient-profile отдаёт его же.
  // eslint-disable-next-line typescript/no-unsafe-type-assertion
  return (envelope.payload ?? null) as T
}

export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options, false)
}
