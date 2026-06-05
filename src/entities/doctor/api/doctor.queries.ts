import { queryOptions } from '@tanstack/react-query'

import { getDoctorById } from './get-doctor-by-id'
import { getDoctors } from './get-doctors'

export const DOCTOR_QUERIES = {
  all: () => ['doctors'] as const,
  lists: () => [...DOCTOR_QUERIES.all(), 'list'] as const,
  list: () =>
    queryOptions({
      queryKey: [...DOCTOR_QUERIES.lists()],
      queryFn: () => getDoctors(),
    }),
  details: () => [...DOCTOR_QUERIES.all(), 'detail'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...DOCTOR_QUERIES.details(), id],
      queryFn: () => getDoctorById(id),
    }),
} as const
