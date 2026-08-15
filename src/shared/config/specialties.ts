import { z } from 'zod'

export const SpecialtySchema = z.object({
  key: z.string(),
  label: z.string(),
  iconKey: z.enum(['heart', 'brain', 'stomach', 'joints', 'eye', 'tooth', 'trauma', 'ods']),
  /** Canonical doctor specialty string used for filtering. */
  doctorSpecialty: z.string(),
})

export type Specialty = z.infer<typeof SpecialtySchema>

// Eight category tiles shown on the home bento grid. Family Medicine is
// rendered as a hero tile (col-span-2 with eyebrow + warm wash); Urgent Care
// gets a coral-tinted border + diagonal 24/7 ribbon; the rest are flat white.
export const SPECIALTIES: Specialty[] = [
  {
    key: 'family-medicine',
    label: 'Семейный',
    iconKey: 'ods',
    doctorSpecialty: 'Семейный врач',
  },
  {
    key: 'urgent-care',
    label: 'Скорая',
    iconKey: 'trauma',
    doctorSpecialty: 'Скорая помощь',
  },
  {
    key: 'cardiology',
    label: 'Кардиология',
    iconKey: 'heart',
    doctorSpecialty: 'Кардиолог',
  },
  {
    key: 'neurology',
    label: 'Неврология',
    iconKey: 'brain',
    doctorSpecialty: 'Невролог',
  },
  {
    key: 'gastroenterology',
    label: 'ЖКТ',
    iconKey: 'stomach',
    doctorSpecialty: 'Гастроэнтеролог',
  },
  {
    key: 'orthopedics',
    label: 'Ортопедия',
    iconKey: 'joints',
    doctorSpecialty: 'Ортопед',
  },
  {
    key: 'ophthalmology',
    label: 'Окулист',
    iconKey: 'eye',
    doctorSpecialty: 'Офтальмолог',
  },
  {
    key: 'dentistry',
    label: 'Стоматология',
    iconKey: 'tooth',
    doctorSpecialty: 'Стоматолог',
  },
]
