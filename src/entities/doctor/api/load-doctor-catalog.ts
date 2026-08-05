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
