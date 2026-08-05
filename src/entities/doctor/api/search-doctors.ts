import { env } from '@/shared/config'

import { DoctorSearchItemSchema, DoctorSearchResponseSchema } from '../model/doctor-api.schema'
import { toDoctorListItem } from '../model/doctor-view'
import type { DoctorListItem } from '../model/doctor-view'
import { failBuild } from './build-failure'

/** Бэкенд ограничивает limit сотней. */
const PAGE_SIZE = 100
/** Страховка от битого курсора: без неё цикл может не закончиться никогда. */
const MAX_PAGES = 50
/**
 * Доля записей, которые допустимо потерять на валидации. Единичные — битые
 * данные конкретного врача, и обнулять из-за них каталог незачем. Массовые
 * означают разъехавшийся контракт, и выкатывать такую витрину нельзя:
 * пропавшие врачи не отличимы от удалённых, а страницы под них уже
 * проиндексированы.
 */
const MAX_INVALID_SHARE = 0.25

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

  // Страницы читаются строго последовательно: курсор следующей приходит в ответе
  // предыдущей, поэтому Promise.all здесь невозможен в принципе.
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('/doctor-profile/search', env.API_URL)
    url.searchParams.set('limit', String(PAGE_SIZE))
    if (cursor !== null) url.searchParams.set('cursor', cursor)

    // eslint-disable-next-line eslint/no-await-in-loop
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) {
      failBuild(
        `Каталог врачей недоступен: ${response.status} ${response.statusText}. ` +
          `Запрошен ${url.toString()}. Проверьте PUBLIC_API_URL.`,
      )
    }

    // eslint-disable-next-line eslint/no-await-in-loop
    const parsed = DoctorSearchResponseSchema.safeParse(await response.json())
    if (!parsed.success) {
      failBuild(`Каталог врачей вернул неожиданную структуру: ${parsed.error.message}`)
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
    const share = dropped / (doctors.length + dropped)
    if (share > MAX_INVALID_SHARE) {
      failBuild(
        `Каталог врачей не прошёл валидацию: отброшено ${dropped} записей из ${doctors.length + dropped}. ` +
          'Похоже на разъехавшийся контракт, а не на битые данные отдельных врачей. ' +
          'Сборка остановлена, чтобы не выкатить витрину без части врачей.',
      )
    }
    console.warn(`[doctors] отброшено записей, не прошедших валидацию: ${dropped}`)
  }

  if (doctors.length === 0) {
    failBuild('Каталог врачей пуст. Сборка остановлена, чтобы не выкатить витрину без врачей.')
  }

  return doctors
}
