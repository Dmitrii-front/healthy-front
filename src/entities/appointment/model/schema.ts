import { z } from "zod";

export const AppointmentSchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  date: z.iso.datetime(),
  duration: z.number().int().positive(),
  type: z.string(),
  status: z.enum(["confirmed", "pending", "cancelled", "completed"]),
  clinic: z.string(),
  notes: z.string().optional(),
});
