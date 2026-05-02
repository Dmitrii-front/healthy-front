import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Введите email").email("Некорректный email"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
