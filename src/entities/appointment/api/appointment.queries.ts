import { queryOptions } from "@tanstack/react-query";
import { getAppointments } from "./get-appointments";
import { getAppointmentById } from "./get-appointment-by-id";
import type { Appointment } from "../model/types";

interface AppointmentListFilter {
  status?: Appointment["status"];
}

export const APPOINTMENT_QUERIES = {
  all: () => ["appointments"] as const,
  lists: () => [...APPOINTMENT_QUERIES.all(), "list"] as const,
  list: (filter?: AppointmentListFilter) =>
    queryOptions({
      queryKey: [...APPOINTMENT_QUERIES.lists(), filter],
      queryFn: () => getAppointments(filter),
    }),
  details: () => [...APPOINTMENT_QUERIES.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...APPOINTMENT_QUERIES.details(), id],
      queryFn: () => getAppointmentById(id),
    }),
} as const;
