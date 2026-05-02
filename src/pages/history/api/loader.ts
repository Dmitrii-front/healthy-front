import type { QueryClient } from "@tanstack/react-query";
import { MEDICAL_RECORD_QUERIES } from "@/entities/medical-record";

export async function historyLoader({ context }: { context: { queryClient: QueryClient } }) {
  await context.queryClient.ensureQueryData(MEDICAL_RECORD_QUERIES.current());
  return null;
}
