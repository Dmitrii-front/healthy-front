import { queryOptions } from "@tanstack/react-query";
import { getMedicalRecord } from "./get-medical-record";

export const MEDICAL_RECORD_QUERIES = {
  all: () => ["medical-record"] as const,
  current: () =>
    queryOptions({
      queryKey: [...MEDICAL_RECORD_QUERIES.all(), "current"],
      queryFn: () => getMedicalRecord(),
      staleTime: 5 * 60_000,
    }),
} as const;
