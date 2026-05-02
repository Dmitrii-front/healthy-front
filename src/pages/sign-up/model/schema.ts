import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Введите имя"),
  email: z.string().min(1, "Введите email").email("Некорректный email"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .regex(/(?=.*[A-Z])(?=.*[0-9])/, "Нужна заглавная буква и цифра"),
  agree: z.literal(true, { message: "Необходимо согласие" }),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
