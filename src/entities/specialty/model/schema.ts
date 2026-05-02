import { z } from "zod";

export const SpecialtySchema = z.object({
  key: z.string(),
  label: z.string(),
  iconKey: z.enum(["heart", "brain", "stomach", "joints", "eye", "tooth", "trauma", "ods"]),
  count: z.number().int().nonnegative(),
  /** Canonical doctor specialty string used for filtering. */
  doctorSpecialty: z.string(),
});
