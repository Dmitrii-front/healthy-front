import { queryOptions } from '@tanstack/react-query'

import type { Appointment } from '../model/types'
import { getAppointmentById } from './get-appointment-by-id'
import { getAppointments } from './get-appointments'

interface AppointmentListFilter {
  status?: Appointment['status']
}

export const APPOINTMENT_QUERIES = {
  all: () => ['appointments'] as const,
  lists: () => [...APPOINTMENT_QUERIES.all(), 'list'] as const,
  list: (filter?: AppointmentListFilter) =>
    queryOptions({
      queryKey: [...APPOINTMENT_QUERIES.lists(), filter],
      queryFn: () => getAppointments(filter),
    }),
  details: () => [...APPOINTMENT_QUERIES.all(), 'detail'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...APPOINTMENT_QUERIES.details(), id],
      queryFn: () => getAppointmentById(id),
    }),
} as const
