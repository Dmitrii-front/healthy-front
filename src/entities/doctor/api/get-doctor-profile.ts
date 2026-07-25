import { env } from '@/shared/config'

import { DoctorProfileResponseSchema } from '../model/doctor-api.schema'
import { toDoctorProfileView } from '../model/doctor-view'
import type { DoctorProfileView } from '../model/doctor-view'

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
