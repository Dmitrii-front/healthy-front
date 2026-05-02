import type { Doctor } from "../model/types";
import { DOCTOR_MOCKS } from "../mock/doctors.mock";

export async function getDoctorById(id: string): Promise<Doctor> {
  // TODO: replace with real API call
  // return apiClient.get<Doctor>(`/doctors/${id}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
  const found = DOCTOR_MOCKS.find((d) => d.id === id);
  if (!found) throw new Error(`Doctor ${id} not found`);
  return found;
}
