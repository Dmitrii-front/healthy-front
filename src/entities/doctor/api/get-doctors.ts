import type { Doctor } from "../model/types";
import { DOCTOR_MOCKS } from "../mock/doctors.mock";

export async function getDoctors(): Promise<Doctor[]> {
  // TODO: replace with real API call once backend exists
  // return apiClient.get<Doctor[]>('/doctors');
  await new Promise((resolve) => setTimeout(resolve, 200)); // simulate latency
  return DOCTOR_MOCKS;
}
