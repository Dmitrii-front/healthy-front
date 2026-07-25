import { z } from 'zod'

/**
 * price_from приходит числом из /doctor-profile/search (там его прогоняют через
 * Number() в toDtoFromRow) и строкой "1000.00" из /doctor-profile/:id (TypeORM
 * отдаёт decimal строкой). rating — та же история. Принимаем оба варианта и
 * гасим мусор в null, чтобы NaN не утёк в разметку.
 */
const numericNullable = z
  .union([z.number(), z.string()])
  .transform((value) => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  })
  .nullable()

/** Элемент выдачи GET /doctor-profile/search. */
export const DoctorSearchItemSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  middle_name: z.string().nullable().default(null),
  avatar_url: z.string().nullable().default(null),
  specialization: z.string(),
  primary_work_city: z.string().nullable().default(null),
  price_from: numericNullable.default(null),
  languages: z.array(z.string()).nullable().default(null),
})

/**
 * items намеренно z.unknown(): элементы валидируются поштучно в searchDoctors,
 * чтобы один битый врач не обнулял весь каталог.
 */
export const DoctorSearchResponseSchema = z.object({
  status: z.string(),
  payload: z.object({
    items: z.array(z.unknown()),
    nextCursor: z.string().nullable().default(null),
  }),
})

/** Место работы в публичном профиле врача (уже прошло toPublicWorkplace на бэке). */
export const PublicWorkplaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
  description: z.string().nullable().default(null),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable().default(null),
  map_image_url: z.string().nullable().default(null),
})

/**
 * Активный вид приёма врача. Без него пациент не может ни запросить слоты, ни
 * забронировать: `appointmentTypeId` обязателен и в available-slots, и в
 * POST /appointments. `work_place_id` нужен потому, что место брони выводится из
 * типа, а не выбирается отдельно.
 */
export const PublicAppointmentTypeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  duration_min: z.number(),
  work_place_id: z.uuid(),
})

/**
 * GET /doctor-profile/:id отдаёт сырую сущность, а не урезанный DoctorDto,
 * поэтому полей заметно больше, чем в поиске.
 */
export const DoctorProfileSchema = DoctorSearchItemSchema.extend({
  bio: z.string().nullable().default(null),
  start_practise_date: z.string().nullable().default(null),
  education: z.string().nullable().default(null),
  schedule_note: z.string().nullable().default(null),
  subspecializations: z.array(z.string()).nullable().default(null),
  // Свободный массив строк, а не enum: бэкенд отдаёт "offline"/"online" в сидах
  // и null в проде, тогда как фронтовая мок-схема ждала
  // "in-person"/"online"/"home-visit". Жёсткий enum уронил бы парсинг на живых
  // данных, поэтому принимаем как есть и трактуем на месте использования.
  consultation_formats: z.array(z.string()).nullable().default(null),
  rating: numericNullable.default(null),
  reviews_count: z.number().default(0),
  workplaces: z.array(PublicWorkplaceSchema).default([]),
  // default([]) обязателен, а не косметика: пока правка бэкенда не задеплоена,
  // поля в ответе нет вовсе, и без дефолта профиль перестал бы парситься —
  // страница врача исчезла бы из сборки целиком.
  appointment_types: z.array(PublicAppointmentTypeSchema).default([]),
})

export const DoctorProfileResponseSchema = z.object({
  status: z.string(),
  payload: DoctorProfileSchema,
})

export type DoctorSearchItemDto = z.infer<typeof DoctorSearchItemSchema>
export type DoctorProfileDto = z.infer<typeof DoctorProfileSchema>
export type PublicWorkplaceDto = z.infer<typeof PublicWorkplaceSchema>
