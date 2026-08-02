/// <reference types="astro/client" />
import { z } from 'zod'

const EnvSchema = z.object({
  PUBLIC_API_URL: z.url().default('http://localhost:3000'),
  // Ключ JS API Яндекс Карт. Публичный по устройству: карту рисует браузер, и
  // ключ всё равно виден в devtools. Защищает его не секретность, а список
  // разрешённых Referer в кабинете разработчика. Пустая строка — легальное
  // состояние: интерактивной карты не будет, адрес откроется в Яндекс Картах.
  PUBLIC_YANDEX_MAPS_KEY: z.string().default(''),
})

const parsed = EnvSchema.parse({
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_YANDEX_MAPS_KEY: import.meta.env.PUBLIC_YANDEX_MAPS_KEY,
})

export const env = {
  API_URL: parsed.PUBLIC_API_URL,
  YANDEX_MAPS_KEY: parsed.PUBLIC_YANDEX_MAPS_KEY,
}
