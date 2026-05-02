import type { z } from "zod";
import type { RoleSchema, UserSchema } from "./schema";

export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
