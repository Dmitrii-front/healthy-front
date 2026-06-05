import type { z } from 'zod'

import type { MedicalRecordSchema } from './schema'

export type MedicalRecord = z.infer<typeof MedicalRecordSchema>
