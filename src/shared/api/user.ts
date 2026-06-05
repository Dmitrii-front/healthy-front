import { z } from 'zod'

export const RoleSchema = z.enum(['patient', 'doctor', 'clinic', 'admin'])

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  phone: z.string().nullable().optional(),
  role: RoleSchema,
  isEmailVerified: z.boolean().default(false),
  isPhoneVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Role = z.infer<typeof RoleSchema>
export type User = z.infer<typeof UserSchema>
