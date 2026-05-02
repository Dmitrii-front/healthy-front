import { z } from "zod";

export const ReviewSchema = z.object({
  author: z.string(),
  date: z.string(), // already-formatted ru month label, e.g. "апр. 2026"
  rating: z.number().int().min(1).max(5),
  text: z.string(),
});

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
  photoUrl: z.string().url().optional(),

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
});
