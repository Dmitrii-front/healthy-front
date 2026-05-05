import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email({ pattern: z.regexes.html5Email, error: "Некорректный email" }),
  password: z
    .string()
    .min(1, "Введите пароль")
    .min(8, "Минимум 8 символов")
    .regex(/(?=.*[A-Z])(?=.*[0-9])/, "Нужна заглавная буква и цифра"),
  agree: z.boolean().refine((v) => v, "Необходимо согласие"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
