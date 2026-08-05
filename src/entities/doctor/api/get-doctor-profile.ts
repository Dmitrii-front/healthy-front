import { env } from '@/shared/config'

import { DoctorProfileResponseSchema } from '../model/doctor-api.schema'
import { toDoctorProfileView } from '../model/doctor-view'
import type { DoctorProfileView } from '../model/doctor-view'
import { failBuild } from './build-failure'

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
      failBuild(`Профиль ${id} не прошёл валидацию: ${parsed.error.message}`)
    }

    return { ok: true, doctor: toDoctorProfileView(parsed.data.payload) }
  }

  failBuild(lastError?.message ?? `Профиль ${id}: запрос не удался`)
}
