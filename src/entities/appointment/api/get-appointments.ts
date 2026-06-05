import { APPOINTMENT_MOCKS } from '../mock/appointments.mock'
import type { Appointment } from '../model/types'

interface Filter {
  status?: Appointment['status']
}

export async function getAppointments(filter?: Filter): Promise<Appointment[]> {
  // TODO: replace with real API call once backend exists
  // return apiClient.get<Appointment[]>('/appointments', { params: filter });
  await new Promise((resolve) => setTimeout(resolve, 200)) // simulate latency
  if (!filter?.status) return APPOINTMENT_MOCKS
  return APPOINTMENT_MOCKS.filter((a) => a.status === filter.status)
}
