import type { Specialty } from "../model/types";

// Eight category tiles shown on the home bento grid. Family Medicine is
// rendered as a hero tile (col-span-2 with eyebrow + warm wash); Urgent Care
// gets a coral-tinted border + diagonal 24/7 ribbon; the rest are flat white.
export const SPECIALTIES: Specialty[] = [
  {
    key: "family-medicine",
    label: "Семейный",
    iconKey: "ods",
    count: 28,
    doctorSpecialty: "Семейный врач",
  },
  {
    key: "urgent-care",
    label: "Скорая",
    iconKey: "trauma",
    count: 22,
    doctorSpecialty: "Скорая помощь",
  },
  {
    key: "cardiology",
    label: "Кардиология",
    iconKey: "heart",
    count: 14,
    doctorSpecialty: "Кардиолог",
  },
  {
    key: "neurology",
    label: "Неврология",
    iconKey: "brain",
    count: 11,
    doctorSpecialty: "Невролог",
  },
  {
    key: "gastroenterology",
    label: "ЖКТ",
    iconKey: "stomach",
    count: 9,
    doctorSpecialty: "Гастроэнтеролог",
  },
  {
    key: "orthopedics",
    label: "Ортопедия",
    iconKey: "joints",
    count: 17,
    doctorSpecialty: "Ортопед",
  },
  {
    key: "ophthalmology",
    label: "Окулист",
    iconKey: "eye",
    count: 12,
    doctorSpecialty: "Офтальмолог",
  },
  {
    key: "dentistry",
    label: "Стоматология",
    iconKey: "tooth",
    count: 19,
    doctorSpecialty: "Стоматолог",
  },
];
