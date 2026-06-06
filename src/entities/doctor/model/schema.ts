import { z } from 'zod'

export const ReviewSchema = z.object({
  author: z.string(),
  date: z.string(), // pre-formatted Russian short-month label (e.g. abbreviated month + year)
  rating: z.number().int().min(1).max(5),
  text: z.string(),
})

export const DoctorSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  specialty: z.string(),
  subspecialty: z.string().optional(),
  clinic: z.string(),
  color: z.string(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  distance: z.string().optional(),
  nextAvailable: z.string().optional(),
  photoUrl: z.url().optional(),

  // Detail-page fields (optional — only fully populated for a few mocks).
  yearsExperience: z.number().int().nonnegative().optional(),
  acceptingNewPatients: z.boolean().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  languages: z.array(z.string()).optional(),
  conditionsTreated: z.array(z.string()).optional(),
  insurances: z.array(z.string()).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  reviews: z.array(ReviewSchema).optional(),

  // Profile/booking fields surfaced on the doctor-detail screen.
  city: z.string().optional(),
  licenseNumber: z.string().optional(),
  priceFrom: z.number().int().nonnegative().optional(),
  scheduleNote: z.string().optional(),
  consultationFormats: z.array(z.enum(['online', 'in-person', 'home-visit'])).optional(),
  certificates: z.array(z.string()).optional(),
  recommendRate: z.number().int().min(0).max(100).optional(),
  clinicHours: z.string().optional(),
})
