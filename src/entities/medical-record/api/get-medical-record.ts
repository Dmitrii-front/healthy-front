import { getMe } from "@/shared/api/get-me";
import { deriveFirstNameFromEmail } from "@/entities/patient/lib/derive-name";
import type { MedicalRecord } from "../model/types";
import { MEDICAL_RECORD_MOCK } from "../mock/medical-record.mock";

/**
 * Merges email/phone (and a derived first name) from POST /auth/me into the
 * static medical-record mock until the backend exposes /patient-profile/me.
 */
export async function getMedicalRecord(): Promise<MedicalRecord> {
  const user = await getMe();
  const derivedFirst = deriveFirstNameFromEmail(user.email);
  const firstName = derivedFirst.length > 0 ? derivedFirst : MEDICAL_RECORD_MOCK.firstName;

  return {
    ...MEDICAL_RECORD_MOCK,
    firstName,
    email: user.email,
    phone: user.phone ?? MEDICAL_RECORD_MOCK.phone,
  };
}
