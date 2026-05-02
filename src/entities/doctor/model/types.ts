import type { z } from "zod";
import type { DoctorSchema, ReviewSchema } from "./schema";

export type Doctor = z.infer<typeof DoctorSchema>;
export type Review = z.infer<typeof ReviewSchema>;
