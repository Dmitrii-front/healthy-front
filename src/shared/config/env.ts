/// <reference types="vite/client" />
import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = EnvSchema.parse({
  VITE_API_URL: import.meta.env["VITE_API_URL"],
});

export const env = {
  API_URL: parsed.VITE_API_URL,
};
