import type { z } from "zod";
import type { SpecialtySchema } from "./schema";

export type Specialty = z.infer<typeof SpecialtySchema>;
