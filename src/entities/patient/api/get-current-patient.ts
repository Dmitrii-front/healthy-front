import { getMe } from "@/shared/api/get-me";
import type { Patient } from "../model/types";
import { PATIENT_MOCK } from "../mock/patient.mock";
import { deriveFirstNameFromEmail } from "../lib/derive-name";

/**
 * Pulls identity (id, derived first name, initials) from the authenticated user
 * via POST /auth/me, and merges everything else from the static mock until the
 * backend exposes a real patient-profile endpoint.
 */
export async function getCurrentPatient(): Promise<Patient> {
  const user = await getMe();
  const derivedFirst = deriveFirstNameFromEmail(user.email);
  const firstName = derivedFirst.length > 0 ? derivedFirst : PATIENT_MOCK.firstName;
  const lastName = PATIENT_MOCK.lastName;
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || PATIENT_MOCK.initials;

  return {
    ...PATIENT_MOCK,
    id: user.id,
    firstName,
    lastName,
    initials,
  };
}
