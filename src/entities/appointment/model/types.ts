import type { z } from "zod";
import type { AppointmentSchema } from "./schema";

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";
