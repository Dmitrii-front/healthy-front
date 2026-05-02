import type { QueryClient } from "@tanstack/react-query";
import { DOCTOR_QUERIES } from "@/entities/doctor";

export async function doctorDetailLoader({
  params,
  context,
}: {
  params: { doctorId: string };
  context: { queryClient: QueryClient };
}) {
  await context.queryClient.ensureQueryData(DOCTOR_QUERIES.detail(params.doctorId));
  return null;
}
