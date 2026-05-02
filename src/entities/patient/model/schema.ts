import { z } from "zod";

export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dob: z.string(),
  pcpId: z.string().optional(),
  insurance: z.string().optional(),
  memberId: z.string().optional(),
  memberSinceYear: z.number().int().optional(),
  initials: z.string().optional(),
});
