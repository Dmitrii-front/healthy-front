import type { QueryClient } from "@tanstack/react-query";
import { APPOINTMENT_QUERIES } from "@/entities/appointment";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { MEDICAL_RECORD_QUERIES } from "@/entities/medical-record";
import { PATIENT_QUERIES } from "@/entities/patient";

export const homeLoader = ({ context }: { context: { queryClient: QueryClient } }) => {
  // Fire /auth/me-derived queries as background prefetches — do NOT gate the
  // route render on them. The greeting renders without a name, and the
  // health snapshot block stays hidden, until they resolve and update in
  // place. Keeps first paint below the backend's /me latency.
  void context.queryClient.prefetchQuery(PATIENT_QUERIES.current());
  void context.queryClient.prefetchQuery(MEDICAL_RECORD_QUERIES.current());
  // Block only on local mock data (resolves in ~200 ms).
  return Promise.all([
    context.queryClient.ensureQueryData(APPOINTMENT_QUERIES.list()),
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.list()),
  ]);
};
