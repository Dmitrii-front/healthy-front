/**
 * Яндекс Карты JS API 3.0 — ленивый загрузчик и фирменный стиль подложки.
 *
 * Инфраструктура: знает, как поднять карту и в какие цвета её покрасить, и
 * ничего не знает ни про врачей, ни про клиники. Кто и зачем показывает точку —
 * дело вызывающей стороны.
 *
 * Почему CDN, а не npm-пакет: рантайм JS API распространяется только скриптом с
 * api-maps.yandex.ru, npm отдаёт лишь типы. Тянуть их ради пяти конструкторов
 * значит завязать сборку на версию, которую CDN может обогнать, — поэтому ниже
 * описана ровно та часть API, которой мы пользуемся.
 */

import { env } from '@/shared/config'

/** JS API 3.0 принимает координаты как [долгота, широта] — обратно к Leaflet. */
export type LngLat = [lng: number, lat: number]

/** Всё, что можно положить в карту через addChild: слои, маркеры, контролы. */
interface YMapChild {
  readonly children?: unknown
}

/** Метка. `update` унаследован от GenericEntity — им и переставляем пин. */
export interface YandexMapMarker extends YMapChild {
  update(props: { coordinates: LngLat }): void
}

export interface YandexMap extends YMapChild {
  /** Текущий зум. Геттер, не проп — писать через setLocation. */
  readonly zoom: number
  readonly center: LngLat
  /** Пределы карты: сейчас 0–21. Читаем, а не хардкодим — Яндекс их меняет. */
  readonly zoomRange: { min: number; max: number }
  addChild(child: YMapChild): YandexMap
  setLocation(location: { center?: LngLat; zoom?: number; duration?: number }): void
  destroy(): void
}

/**
 * Готового контрола зума в JS API 3.0 нет: пакета `@yandex/ymaps3-controls`
 * не существует (loader отдаёт ошибку), а `@yandex/ymaps3-controls-extra`
 * экспортирует только YMapOpenMapsButton. Проверено в рантайме. Поэтому шаг
 * зума считаем сами — отсюда и эта функция, а не чужой контрол.
 */
export function stepZoom(map: YandexMap, delta: number): void {
  const { min, max } = map.zoomRange
  const next = Math.min(max, Math.max(min, Math.round(map.zoom) + delta))
  if (next === map.zoom) return
  map.setLocation({ zoom: next, duration: 180 })
}

interface Ymaps3 {
  ready: Promise<void>
  YMap: new (
    root: HTMLElement,
    props: {
      location: { center: LngLat; zoom: number }
      mode?: 'auto' | 'vector' | 'raster'
      theme?: 'light' | 'dark'
      behaviors?: string[]
      /**
       * Положение кнопки «Открыть в Картах». Официальный проп YMap — позицию
       * ей менять можно (в отличие от скрытия: `distribution: false` нарушил бы
       * п. 4.1.3 условий использования). По умолчанию 'bottom left', где на
       * узких экранах она перекрывает собственный копирайт Яндекса.
       */
      distributionPosition?: 'top left' | 'top right' | 'bottom left' | 'bottom right'
    },
  ) => YandexMap
  YMapDefaultSchemeLayer: new (props: {
    customization?: { style: MapCustomizationRule[]; 'render-3d'?: 'off' }
  }) => YMapChild
  YMapDefaultFeaturesLayer: new (props: Record<string, never>) => YMapChild
  YMapMarker: new (props: { coordinates: LngLat }, element?: HTMLElement) => YandexMapMarker
}

interface MapCustomizationRule {
  tags?: { all?: string[]; any?: string[]; none?: string[] }
  types?: 'point' | 'polyline' | 'polygon'
  elements?: string
  stylers?: Array<Record<string, string | number>>
}

declare global {
  interface Window {
    ymaps3?: Ymaps3
  }
}

/**
 * Стиль подложки под палитру приложения.
 *
 * Стоковая карта Яндекса — серо-зелёная и плотная по POI: рядом с тёплой бумагой
 * страницы она читается как чужой виджет, вставленный в макет. Здесь земля берёт
 * фон страницы, вода — мягкий бренд-тил, дороги белые с той же волосяной
 * линией, что у карточек, подписи — графит основного текста.
 *
 * Цвета заданы hex-литералами, а не токенами: кастомизация уезжает в JSON внутрь
 * канваса Яндекса, куда CSS-переменные не доходят. Значения совпадают с
 * литералами страницы врача — при правке палитры их надо менять парой.
 *
 * Осторожно: неизвестный тег роняет ВЕСЬ блок правила молча, без ошибки в
 * консоли. Добавляя правило, сверяйтесь со словарём тегов в документации.
 */
export const YANDEX_MAP_STYLE: MapCustomizationRule[] = [
  {
    tags: { any: ['landscape', 'land', 'landcover', 'vegetation', 'urban_area'] },
    elements: 'geometry',
    stylers: [{ color: '#faf8f5' }],
  },
  {
    tags: { any: ['park', 'national_park'] },
    elements: 'geometry',
    stylers: [{ color: '#f1f3ee' }],
  },
  {
    tags: { any: ['water', 'bathymetry'] },
    elements: 'geometry',
    stylers: [{ color: '#dceef1' }],
  },
  {
    tags: { any: ['road'] },
    elements: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    tags: { any: ['road'] },
    elements: 'geometry.outline',
    stylers: [{ color: '#edebe6' }],
  },
  {
    tags: { any: ['building'] },
    elements: 'geometry',
    stylers: [{ color: '#f4f1ec' }, { 'secondary-color': '#e6e2da' }],
  },
  {
    tags: { any: ['road', 'admin', 'locality', 'district'] },
    elements: 'label.text.fill',
    stylers: [{ color: '#2a2d33' }],
  },
  // Белый ореол вокруг подписей нужен стоковой пёстрой карте, чтобы текст не
  // терялся. На нашей — светлой и однотонной — он читается как грязь по буквам.
  {
    elements: 'label.text.outline',
    stylers: [{ opacity: 0 }],
  },
  // Чужие организации гасим целиком: на карточке ровно одна значимая точка —
  // клиника, куда едет пациент. Побочный эффект: пропадает и родная метка самой
  // клиники из данных Яндекса, но её мы и так рисуем своим пином.
  {
    tags: { any: ['poi'] },
    elements: 'label',
    stylers: [{ visibility: 'off' }],
  },
]

/** Без ключа карту не поднять — API отдаёт 403 и рисует пустой холст. */
export function hasYandexMapsKey(): boolean {
  return env.YANDEX_MAPS_KEY !== ''
}

let loading: Promise<Ymaps3> | null = null

/**
 * Подгружает JS API 3.0 и резолвится, когда он готов к работе.
 *
 * Скрипт весит около сотни килобайт и на большинстве визитов не нужен — карту
 * открывают единицы, — поэтому грузим по требованию, а не в `<head>`. Промис
 * кэшируется: два быстрых клика по разным адресам не вставят второй `<script>`.
 */
export async function loadYandexMaps(): Promise<Ymaps3> {
  if (window.ymaps3) {
    await window.ymaps3.ready
    return window.ymaps3
  }
  if (loading) return loading

  loading = new Promise<Ymaps3>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(
      env.YANDEX_MAPS_KEY,
    )}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      const api = window.ymaps3
      if (!api) {
        reject(new Error('Яндекс Карты: скрипт загрузился, но глобальный ymaps3 не появился'))
        return
      }
      api.ready.then(() => resolve(api), reject)
    }
    // Ключ с чужим доменом в ограничениях, оффлайн, блокировщик — во всех
    // случаях наверх уходит одна ошибка, а вызывающая сторона показывает запасной
    // путь. Промис при этом сбрасываем: следующий клик имеет право попробовать
    // снова, иначе разовый сетевой сбой убивал бы карту до перезагрузки страницы.
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Яндекс Карты: не удалось загрузить JS API'))
    }
    document.head.appendChild(script)
  })

  return loading
}

/**
 * Ссылка на Яндекс Карты для запасного пути: нет ключа, не загрузился API или
 * у места нет координат. Точку показываем пином, если координаты есть, иначе
 * отдаём поиск по адресу текстом.
 */
export function yandexMapsUrl(query: string, point: { lat: number; lng: number } | null): string {
  if (point) {
    const ll = `${point.lng},${point.lat}`
    return `https://yandex.ru/maps/?pt=${ll}&z=17&l=map&text=${encodeURIComponent(query)}`
  }
  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`
}
