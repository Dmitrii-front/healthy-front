import { z } from 'zod'

export const MedicalRecordSchema = z.object({
  // Personal
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable().optional(),
  gender: z.enum(['female', 'male', 'other']),
  dob: z.string(), // ISO date
  avatarUrl: z.url().nullable().optional(),

  // Contacts
  phone: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  address: z.string().nullable().optional(),

  // Emergency contact
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),

  // Medical history
  bloodGroup: z.string().nullable().optional(),
  rhFactor: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  chronicConditions: z.string().nullable().optional(),
  currentMedications: z.string().nullable().optional(),
  pastSurgeries: z.string().nullable().optional(),
  familyHistory: z.string().nullable().optional(),
  vaccinationStatus: z.string().nullable().optional(),

  // Lifestyle
  smokingStatus: z.string().nullable().optional(),
  alcoholUse: z.string().nullable().optional(),
  physicalActivityLevel: z.string().nullable().optional(),
  dietType: z.string().nullable().optional(),

  // Social
  occupation: z.string().nullable().optional(),
  workplace: z.string().nullable().optional(),
  workConditions: z.string().nullable().optional(),
  livingConditions: z.string().nullable().optional(),

  // Epidemiology
  travelHistory: z.string().nullable().optional(),
  petsAtHome: z.boolean().nullable().optional(),
  animalContactDetails: z.string().nullable().optional(),

  // Settings
  preferredLanguage: z.enum(['ru', 'en', 'kk']).nullable().optional(),
  consentPersonalData: z.boolean().default(false),
  consentMedicalData: z.boolean().default(false),
})
