import type { MedicalRecord } from '../model/types'

// Default medical-record content for the demo patient (overlaid with /auth/me data).
export const MEDICAL_RECORD_MOCK: MedicalRecord = {
  firstName: 'Демо',
  lastName: 'Пациент',
  middleName: 'Примеровна',
  gender: 'female',
  dob: '1989-03-22',
  avatarUrl: null,

  phone: '+1 202-555-0100',
  email: 'demo.patient@example.com',
  country: 'Демо-страна',
  city: 'Примерск',
  region: 'Тестовый регион',
  district: 'Демонстрационный район',
  address: 'ул. Примерная, 100, кв. 1',

  emergencyContactName: 'Демо Контакт',
  emergencyContactPhone: '+1 202-555-0101',

  bloodGroup: 'II (A)',
  rhFactor: 'Положительный (+)',
  allergies: 'Пенициллин — крапивница',
  chronicConditions: 'Гипертония 1 ст.',
  currentMedications: 'Розувастатин 10 мг — 1 раз в день',
  pastSurgeries: 'Аппендэктомия, 2014',
  familyHistory: 'ИБС у отца, диабет 2 типа у матери',
  vaccinationStatus: 'COVID-19 (2024), грипп (2024)',

  smokingStatus: 'Не курит',
  alcoholUse: 'Редко (по случаю)',
  physicalActivityLevel: 'Умеренная (3–4 раза в неделю)',
  dietType: 'Сбалансированное, без ограничений',

  occupation: 'Демо-специалист',
  workplace: 'Компания «Пример»',
  workConditions: 'Сидячая работа, нагрузка на глаза, ночные дедлайны',
  livingConditions: 'Собственная квартира',

  travelHistory: 'Турция (июнь 2025), Грузия (сент. 2025)',
  petsAtHome: true,
  animalContactDetails: 'Кошка — ежедневно',

  preferredLanguage: 'ru',
  consentPersonalData: true,
  consentMedicalData: true,
}
