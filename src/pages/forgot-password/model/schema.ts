import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email({ pattern: z.regexes.html5Email, error: "Некорректный email" }),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
