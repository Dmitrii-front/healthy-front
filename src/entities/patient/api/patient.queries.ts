import { queryOptions } from "@tanstack/react-query";
import { getCurrentPatient } from "./get-current-patient";

export const PATIENT_QUERIES = {
  all: () => ["patient"] as const,
  current: () =>
    queryOptions({
      queryKey: [...PATIENT_QUERIES.all(), "current"],
      queryFn: () => getCurrentPatient(),
    }),
} as const;
