import type { Appointment } from "../model/types";
import { APPOINTMENT_MOCKS } from "../mock/appointments.mock";

export async function getAppointmentById(id: string): Promise<Appointment> {
  // TODO: replace with real API call
  // return apiClient.get<Appointment>(`/appointments/${id}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
  const found = APPOINTMENT_MOCKS.find((a) => a.id === id);
  if (!found) throw new Error(`Appointment ${id} not found`);
  return found;
}
