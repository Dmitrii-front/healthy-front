/**
 * Запись на приём для публичной Astro-зоны.
 *
 * Порядок вызовов, который навязан бэкендом:
 *   1. вид приёма приходит вместе с профилем врача (GET /doctor-profile/:id);
 *   2. слоты запрашиваются ТОЛЬКО по виду приёма — он задаёт и длительность, и
 *      рабочее место (available-slots выводит место из типа);
 *   3. бронь требует профиля пациента, иначе 404 PATIENT_PROFILE_REQUIRED;
 *   4. end_time считает сервер, клиент его не передаёт.
 */

import { ApiError, apiRequest } from './api'

/* ─── Слоты ──────────────────────────────────────────────────────────── */

export interface SlotWorkplace {
  id: string
  name: string
  address: string
}

export interface Slot {
  start_time: string
  end_time: string
  available: boolean
}

export interface DayAvailability {
  date: string
  workplace: SlotWorkplace
  slots: Slot[]
}

/**
 * Горизонт записи: на сколько дней вперёд, считая сегодняшний, страница врача
 * показывает ленту дат и спрашивает доступность.
 *
 * Потолок здесь не наш, а серверный: available-slots отвечает
 * `400 DATE_RANGE_TOO_LARGE`, если `to - from` больше 90 суток
 * (ScheduleService.MAX_SLOT_RANGE_DAYS). Окно шириной N даёт разницу N-1, так
 * что физический максимум — 91; 90 оставляет сутки запаса и совпадает с
 * лимитом бэкенда по формулировке «три месяца».
 *
 * Верхней границы у самой брони нет: расписание врача хранится недельным
 * паттерном и формально свободно бессрочно, POST /appointments проверяет только
 * прошлое, наличие в расписании, исключения и пересечения. То есть горизонт —
 * решение витрины, а не запрет сервера. Дальше он упирается в то, насколько
 * заранее врачи успевают завести отпуска отдельными исключениями: показанный,
 * но не подтверждённый слот превращается в отмену.
 */
export const BOOKING_WINDOW_DAYS = 90

/**
 * Тот же горизонт словами — для сообщения «здесь нет свободного времени
 * в ближайшие …». Живёт рядом с числом намеренно: раньше «две недели» были
 * вписаны в строку руками и о смене WINDOW_DAYS не узнали бы.
 */
export const BOOKING_WINDOW_LABEL = 'три месяца'

/**
 * Свободное время врача по конкретному виду приёма. Публичный эндпоинт,
 * токен не нужен.
 *
 * ВАЖНО: на неизвестный, неактивный или чужой тип бэкенд намеренно отвечает
 * `200` с пустым массивом, а не 404 — чтобы эндпоинт не работал оракулом
 * активности типа. Значит пустой ответ НЕ доказывает отсутствие слотов, и
 * трактовать его как «всё занято» нельзя.
 */
export function fetchAvailableSlots(
  doctorId: string,
  appointmentTypeId: string,
  from: string,
  to: string,
): Promise<DayAvailability[]> {
  return apiRequest<DayAvailability[]>('/schedule/available-slots', {
    params: { doctorId, appointmentTypeId, from, to },
  })
}

/* ─── Профиль пациента ───────────────────────────────────────────────── */

/**
 * GET /users/me/profiles отдаёт три профиля пользователя. Нас интересует только
 * факт наличия patient — содержимое не читаем, поэтому unknown достаточно.
 */
interface MyProfiles {
  patient: unknown
  doctor: unknown
  clinic: unknown
}

/** Есть ли у текущего пользователя профиль пациента. Требует токена. */
export async function hasPatientProfile(): Promise<boolean> {
  const profiles = await apiRequest<MyProfiles>('/users/me/profiles', { auth: true })
  return profiles?.patient != null
}

export interface PatientProfileInput {
  first_name: string
  last_name: string
  gender: 'male' | 'female'
  date_of_birth: string
  phone_number: string
  consent_personal_data: boolean
  consent_medical_data: boolean
}

/**
 * Создаёт профиль пациента. 409 PATIENT_PROFILE_ALREADY_EXISTS трактуем как
 * успех: цель — чтобы профиль существовал, а он существует.
 */
export async function createPatientProfile(input: PatientProfileInput): Promise<void> {
  try {
    await apiRequest<unknown>('/patient-profile', {
      method: 'POST',
      body: input,
      auth: true,
    })
  } catch (error) {
    if (error instanceof ApiError && error.errorCode === 'PATIENT_PROFILE_ALREADY_EXISTS') {
      return
    }
    throw error
  }
}

/* ─── Бронь ──────────────────────────────────────────────────────────── */

export interface CreateAppointmentInput {
  doctor_id: string
  appointment_date: string
  start_time: string
  work_place_id: string
  is_online: boolean
  appointmentTypeId: string
  notes?: string
}

export interface CreatedAppointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
}

export function createAppointment(input: CreateAppointmentInput): Promise<CreatedAppointment> {
  return apiRequest<CreatedAppointment>('/appointments', {
    method: 'POST',
    body: input,
    auth: true,
  })
}

/* ─── Оповещение о созданной брони ───────────────────────────────────── */

/**
 * Сетка времени на странице врача и шит записи — два независимых островка:
 * общего состояния у них нет, выбранный слот уезжает в шит через dataset
 * триггера, и обратной дороги не было. Из-за этого только что занятое время
 * оставалось на странице кликабельным до перезагрузки, а повторный клик по нему
 * упирался в 409 SLOT_TAKEN — то есть страница предлагала то, чего уже нет.
 *
 * Событие на document — эта самая обратная дорога. Шит объявляет о брони,
 * страница перезапрашивает доступность. Прямой ссылки друг на друга у них
 * по-прежнему нет: шит один на страницу и ничего не знает про её вёрстку.
 */
export const BOOKING_CREATED_EVENT = 'hm:booking-created'

export interface BookingCreatedDetail {
  /** Чью доступность обновлять: врач у страницы свой, чужую бронь она проспит. */
  doctorId: string
}

/**
 * Событие объявлено глобально, а не приведено типом на месте подписки: без
 * записи в DocumentEventMap слушателю приходит голый Event, и достать из него
 * detail можно было бы только через `as CustomEvent<…>` — то есть пообещать
 * компилятору то, что он не проверит. Здесь обещание даётся один раз и держит
 * оба конца: и dispatch, и addEventListener ниже.
 */
declare global {
  interface DocumentEventMap {
    'hm:booking-created': CustomEvent<BookingCreatedDetail>
  }
}

export function announceBookingCreated(detail: BookingCreatedDetail): void {
  document.dispatchEvent(new CustomEvent(BOOKING_CREATED_EVENT, { detail }))
}

export function onBookingCreated(handler: (detail: BookingCreatedDetail) => void): void {
  document.addEventListener(BOOKING_CREATED_EVENT, (event) => handler(event.detail))
}

/* ─── Ошибки ─────────────────────────────────────────────────────────── */

/**
 * Доменные коды бэкенда в человеческий русский. Смотрим на errorCode, а не на
 * статус: SLOT_TAKEN и RATING_ALREADY_GIVEN оба приходят как 409.
 */
const MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Это время только что заняли. Выберите другое.',
  SLOT_IN_PAST: 'Это время уже прошло. Выберите другое.',
  SLOT_NOT_IN_SCHEDULE: 'Врач не принимает в это время. Выберите другое.',
  SLOT_BLOCKED_BY_EXCEPTION: 'В этот день врач не принимает. Выберите другой день.',
  APPOINTMENT_TYPE_NOT_FOUND: 'Этот вид приёма больше недоступен. Обновите страницу.',
  PATIENT_PROFILE_REQUIRED: 'Заполните данные пациента, чтобы завершить запись.',
  DOCTOR_NOT_FOUND: 'Врач больше не принимает. Обновите страницу.',
  WORK_PLACE_NOT_FOUND: 'Это место приёма больше недоступно. Обновите страницу.',
  UNAUTHORIZED: 'Войдите заново, чтобы завершить запись.',
  NETWORK_ERROR: 'Сервер недоступен. Проверьте подключение.',
}

export function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.errorCode] ?? 'Не удалось записаться. Попробуйте ещё раз.'
  }
  return 'Не удалось записаться. Попробуйте ещё раз.'
}

/** Слот занят — единственный случай, когда есть смысл вернуть к выбору времени. */
export function isSlotConflict(error: unknown): boolean {
  return error instanceof ApiError && error.errorCode === 'SLOT_TAKEN'
}
