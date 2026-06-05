import type { QueryClient } from '@tanstack/react-query'

import { APPOINTMENT_QUERIES } from '@/entities/appointment'
import { DOCTOR_QUERIES } from '@/entities/doctor'

export const visitDetailLoader = ({
  context,
  params,
}: {
  context: { queryClient: QueryClient }
  params: { visitId: string }
}) =>
  Promise.all([
    context.queryClient.ensureQueryData(APPOINTMENT_QUERIES.detail(params.visitId)),
    context.queryClient.ensureQueryData(DOCTOR_QUERIES.list()),
  ])
