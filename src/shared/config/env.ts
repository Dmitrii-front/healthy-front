/// <reference types="astro/client" />
import { z } from 'zod'

// Ключа Яндекс Карт здесь намеренно нет: его читает напрямую
// src/shared/lib/yandex-map.ts, иначе zod и этот parse уезжали бы в клиентский
// бандл страницы врача ради одной строки. Зачем ключ публичный и что бывает
// без него — в .env.example рядом с самой переменной.
const EnvSchema = z.object({
  PUBLIC_API_URL: z.url().default('http://localhost:3000'),
})

const parsed = EnvSchema.parse({
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
})

export const env = {
  API_URL: parsed.PUBLIC_API_URL,
}
