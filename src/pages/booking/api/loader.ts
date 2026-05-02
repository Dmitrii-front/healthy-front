import type { QueryClient } from "@tanstack/react-query";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { PATIENT_QUERIES } from "@/entities/patient";

export async function bookingLoader({
  params,
  context,
}: {
  params: { doctorId: string };
  context: { queryClient: QueryClient };
}) {
  await Promise.all([
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.detail(params.doctorId)),
    context.queryClient.ensureQueryData(PATIENT_QUERIES.current()),
  ]);
  return null;
}
