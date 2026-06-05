import { deriveFirstNameFromEmail } from '@/entities/patient/@x/medical-record'
import { getMe } from '@/shared/api'

import { MEDICAL_RECORD_MOCK } from '../mock/medical-record.mock'
import type { MedicalRecord } from '../model/types'

/**
 * Merges email/phone (and a derived first name) from POST /auth/me into the
 * static medical-record mock until the backend exposes /patient-profile/me.
 * Falls back to the unmodified mock if /me fails — the medical record is
 * standalone information that shouldn't disappear behind an auth error.
 */
export async function getMedicalRecord(): Promise<MedicalRecord> {
  try {
    const user = await getMe()
    const derivedFirst = deriveFirstNameFromEmail(user.email)
    const firstName = derivedFirst.length > 0 ? derivedFirst : MEDICAL_RECORD_MOCK.firstName

    return {
      ...MEDICAL_RECORD_MOCK,
      firstName,
      email: user.email,
      phone: user.phone ?? MEDICAL_RECORD_MOCK.phone,
    }
  } catch {
    return MEDICAL_RECORD_MOCK
  }
}
