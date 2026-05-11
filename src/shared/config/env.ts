/// <reference types="astro/client" />
import { z } from "zod";

const EnvSchema = z.object({
  PUBLIC_API_URL: z.url().default("http://localhost:3000"),
});

const parsed = EnvSchema.parse({
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
});

export const env = {
  API_URL: parsed.PUBLIC_API_URL,
};
