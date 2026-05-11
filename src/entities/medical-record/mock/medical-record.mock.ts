import type { MedicalRecord } from "../model/types";

// Default medical-record content for the demo patient (overlaid with /auth/me data).
export const MEDICAL_RECORD_MOCK: MedicalRecord = {
  firstName: "Елена",
  lastName: "Марш",
  middleName: "Сергеевна",
  gender: "female",
  dob: "1989-03-22",
  avatarUrl: null,

  phone: "+7 776 423 84 19",
  email: "elena.marsh@email.com",
  country: "Казахстан",
  city: "Алматы",
  region: "Алматинская обл.",
  district: "Медеуский",
  address: "ул. Достык 89, кв. 14",

  emergencyContactName: "Дамир Марш (муж)",
  emergencyContactPhone: "+7 701 502 11 67",

  bloodGroup: "II (A)",
  rhFactor: "Положительный (+)",
  allergies: "Пенициллин — крапивница",
  chronicConditions: "Гипертония 1 ст.",
  currentMedications: "Розувастатин 10 мг — 1 раз в день",
  pastSurgeries: "Аппендэктомия, 2014",
  familyHistory: "ИБС у отца, диабет 2 типа у матери",
  vaccinationStatus: "COVID-19 (2024), грипп (2024)",

  smokingStatus: "Не курит",
  alcoholUse: "Редко (по случаю)",
  physicalActivityLevel: "Умеренная (3–4 раза в неделю)",
  dietType: "Сбалансированное, без ограничений",

  occupation: "Product-дизайнер",
  workplace: "IT-компания, удалённо",
  workConditions: "Сидячая работа, нагрузка на глаза, ночные дедлайны",
  livingConditions: "Собственная квартира",

  travelHistory: "Турция (июнь 2025), Грузия (сент. 2025)",
  petsAtHome: true,
  animalContactDetails: "Кошка — ежедневно",

  preferredLanguage: "ru",
  consentPersonalData: true,
  consentMedicalData: true,
};
