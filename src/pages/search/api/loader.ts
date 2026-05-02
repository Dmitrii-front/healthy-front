import type { QueryClient } from "@tanstack/react-query";
import { DOCTOR_QUERIES } from "@/entities/doctor";

export async function searchLoader({ context }: { context: { queryClient: QueryClient } }) {
  await context.queryClient.ensureQueryData(DOCTOR_QUERIES.list());
  return null;
}
