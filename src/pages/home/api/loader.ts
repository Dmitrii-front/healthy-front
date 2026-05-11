import type { QueryClient } from "@tanstack/react-query";
import { APPOINTMENT_QUERIES } from "@/entities/appointment";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { PATIENT_QUERIES } from "@/entities/patient";

export const homeLoader = ({ context }: { context: { queryClient: QueryClient } }) => {
  // Fire the /auth/me-derived patient query as a background prefetch — do NOT
  // gate the route render on it. HomeHeader renders "—" until firstName
  // resolves, then updates in place. This keeps the first paint below the
  // backend's /me latency (was ~2 s in real conditions).
  void context.queryClient.prefetchQuery(PATIENT_QUERIES.current());
  // Block only on local mock data (resolves in ~200 ms).
  return Promise.all([
    context.queryClient.ensureQueryData(APPOINTMENT_QUERIES.list()),
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.list()),
  ]);
};
