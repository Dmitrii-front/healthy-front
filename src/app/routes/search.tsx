import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SearchPage, searchLoader } from "@/pages/search";

const searchSchema = z.object({
  specialty: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loader: searchLoader,
  component: SearchPage,
});
