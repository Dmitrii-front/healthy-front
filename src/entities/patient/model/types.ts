import type { z } from 'zod'

import type { PatientSchema } from './schema'

export type Patient = z.infer<typeof PatientSchema>
