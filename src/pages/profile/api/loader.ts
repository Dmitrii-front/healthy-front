import type { QueryClient } from "@tanstack/react-query";
import { PATIENT_QUERIES } from "@/entities/patient";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { MEDICAL_RECORD_QUERIES } from "@/entities/medical-record";

export async function profileLoader({ context }: { context: { queryClient: QueryClient } }) {
  await Promise.all([
    context.queryClient.ensureQueryData(PATIENT_QUERIES.current()),
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.list()),
    context.queryClient.ensureQueryData(MEDICAL_RECORD_QUERIES.current()),
  ]);
  return null;
}
