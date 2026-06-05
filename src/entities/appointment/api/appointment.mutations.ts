export const APPOINTMENT_MUTATIONS = {
  create: () => ['appointment', 'create'] as const,
  cancel: () => ['appointment', 'cancel'] as const,
  reschedule: () => ['appointment', 'reschedule'] as const,
} as const
