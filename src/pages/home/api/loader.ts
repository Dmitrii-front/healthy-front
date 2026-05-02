import type { QueryClient } from "@tanstack/react-query";
import { APPOINTMENT_QUERIES } from "@/entities/appointment";
import { DOCTOR_QUERIES } from "@/entities/doctor";
import { PATIENT_QUERIES } from "@/entities/patient";

export const homeLoader = ({ context }: { context: { queryClient: QueryClient } }) =>
  Promise.all([
    context.queryClient.ensureQueryData(PATIENT_QUERIES.current()),
    context.queryClient.ensureQueryData(APPOINTMENT_QUERIES.list()),
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.list()),
  ]);
